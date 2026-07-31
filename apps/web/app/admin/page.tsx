import Link from 'next/link';
import { Building2, Users, Stethoscope, Wallet, type LucideIcon } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@welldesk/shared';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AdminDashboardCharts } from '@/components/admin/admin-dashboard-charts';

const STAT_ICON_CLASSES = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-(--success-700)',
  info: 'bg-info/15 text-(--info-700)',
  warning: 'bg-warning/15 text-(--warning-700)',
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  prefix,
  badge,
  note,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof STAT_ICON_CLASSES;
  prefix?: string;
  badge?: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between py-4">
        <div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${STAT_ICON_CLASSES[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {prefix}
            <AnimatedCounter value={value} />
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {note && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{note}</p>}
        </div>
        {badge && (
          <Badge variant="success" className="shrink-0">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminPracticesPage() {
  const supabase = createAdminClient();

  const [{ data: practices }, { data: clients }, { data: owners }, { data: payments }] = await Promise.all([
    supabase.from('practices').select('id, name, tagline, owner_user_id, currency, suspended_at, created_at').order('created_at', { ascending: false }),
    supabase.from('clients').select('practice_id'),
    supabase.from('profiles').select('id, full_name, practice_id').eq('role', 'owner'),
    supabase.from('payments').select('practice_id, amount, payment_date'),
  ]);

  const countByPractice = new Map<string, number>();
  for (const c of clients ?? []) {
    countByPractice.set(c.practice_id, (countByPractice.get(c.practice_id) ?? 0) + 1);
  }

  const ownerByPractice = new Map(owners?.map((o) => [o.practice_id, o.full_name]));
  const currencyByPractice = new Map((practices ?? []).map((p) => [p.id, p.currency ?? 'INR']));

  const revenueByPractice = new Map<string, number>();
  for (const p of payments ?? []) {
    revenueByPractice.set(p.practice_id, (revenueByPractice.get(p.practice_id) ?? 0) + Number(p.amount));
  }

  // Practices can each bill in a different currency, so a single summed
  // "Platform Revenue" number would silently add e.g. INR and USD together.
  // Instead, sum per-currency and headline whichever currency has the
  // largest total — with everything else called out in a caveat rather than
  // folded into a misleading number. The per-practice table below always
  // shows each row in its own currency, so it's never ambiguous there.
  const revenueByCurrency = new Map<string, number>();
  for (const p of payments ?? []) {
    const cur = currencyByPractice.get(p.practice_id) ?? 'INR';
    revenueByCurrency.set(cur, (revenueByCurrency.get(cur) ?? 0) + Number(p.amount));
  }
  const currenciesInUse = [...revenueByCurrency.keys()];
  const dominantCurrency = currenciesInUse.reduce(
    (best, cur) => (!best || (revenueByCurrency.get(cur) ?? 0) > (revenueByCurrency.get(best) ?? 0) ? cur : best),
    currenciesInUse[0] ?? 'INR'
  );
  const otherCurrencies = currenciesInUse.filter((c) => c !== dominantCurrency);

  // Stats
  const totalPractices = practices?.length ?? 0;
  const activePractices = (practices ?? []).filter((p) => !p.suspended_at).length;
  const suspendedPractices = totalPractices - activePractices;
  const totalDietitians = owners?.length ?? 0;
  const totalClients = clients?.length ?? 0;
  const totalRevenue = revenueByCurrency.get(dominantCurrency) ?? 0;

  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const newPracticesThisMonth = (practices ?? []).filter((p) => p.created_at?.slice(0, 7) === currentMonthKey).length;

  // 6-month trends
  const monthKeys: string[] = [];
  const monthLabels = new Map<string, string>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthKeys.push(key);
    monthLabels.set(key, d.toLocaleString('en-US', { month: 'short' }));
  }

  // Trend chart is scoped to the dominant currency only, for the same
  // reason the headline stat is — summing different currencies month over
  // month would be just as misleading.
  const revenueByMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const p of payments ?? []) {
    if ((currencyByPractice.get(p.practice_id) ?? 'INR') !== dominantCurrency) continue;
    const key = p.payment_date.slice(0, 7);
    if (revenueByMonth.has(key)) revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(p.amount));
  }
  const revenueTrend = monthKeys.map((key) => ({ month: monthLabels.get(key)!, value: revenueByMonth.get(key) ?? 0 }));

  const signupsByMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const p of practices ?? []) {
    const key = p.created_at?.slice(0, 7);
    if (key && signupsByMonth.has(key)) signupsByMonth.set(key, (signupsByMonth.get(key) ?? 0) + 1);
  }
  const signupTrend = monthKeys.map((key) => ({ month: monthLabels.get(key)!, value: signupsByMonth.get(key) ?? 0 }));

  const statusBreakdown = [
    { name: 'Active', value: activePractices, color: 'var(--chart-2)' },
    { name: 'Suspended', value: suspendedPractices, color: 'var(--chart-5)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform-wide stats across every practice</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Practices"
          value={totalPractices}
          icon={Building2}
          tone="primary"
          badge={newPracticesThisMonth > 0 ? `+${newPracticesThisMonth} this mo.` : undefined}
        />
        <StatCard label="Dietitians" value={totalDietitians} icon={Stethoscope} tone="info" />
        <StatCard label="Clients" value={totalClients} icon={Users} tone="success" />
        <StatCard
          label="Platform Revenue"
          value={totalRevenue}
          icon={Wallet}
          tone="warning"
          prefix={getCurrencySymbol(dominantCurrency)}
          note={otherCurrencies.length > 0 ? `+ revenue in ${otherCurrencies.join(', ')} not included` : undefined}
        />
      </div>

      <AdminDashboardCharts
        revenueTrend={revenueTrend}
        signupTrend={signupTrend}
        statusBreakdown={statusBreakdown}
        currency={dominantCurrency}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Practice</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!practices || practices.length === 0) && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState icon={Building2} title="No practices yet" compact />
                </TableCell>
              </TableRow>
            )}
            {practices?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/practices/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{ownerByPractice.get(p.id) ?? '—'}</TableCell>
                <TableCell>{countByPractice.get(p.id) ?? 0}</TableCell>
                <TableCell>{formatCurrency(revenueByPractice.get(p.id) ?? 0, currencyByPractice.get(p.id) ?? 'INR')}</TableCell>
                <TableCell className="whitespace-nowrap">{p.created_at.slice(0, 10)}</TableCell>
                <TableCell>
                  {p.suspended_at ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
