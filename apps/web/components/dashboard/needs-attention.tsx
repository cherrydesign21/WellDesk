import Link from 'next/link';
import { AlertTriangle, CalendarClock, Wallet, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export type AttentionItem = {
  id: string;
  clientId: string;
  clientName: string;
  reason: string;
  kind: 'expiring' | 'inactive' | 'overdue';
};

const KIND_ICONS = { expiring: CalendarClock, inactive: UserX, overdue: Wallet } as const;
const KIND_CLASSES = {
  expiring: 'bg-warning/15 text-(--warning-700)',
  inactive: 'bg-info/15 text-(--info-700)',
  overdue: 'bg-destructive/15 text-destructive',
} as const;

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Needs Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Nothing needs attention" compact />
        ) : (
          items.map((item) => {
            const Icon = KIND_ICONS[item.kind];
            return (
              <Link
                key={item.id}
                href={`/clients/${item.clientId}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${KIND_CLASSES[item.kind]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{item.clientName}</span>
                  <span className="text-muted-foreground"> — {item.reason}</span>
                </span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
