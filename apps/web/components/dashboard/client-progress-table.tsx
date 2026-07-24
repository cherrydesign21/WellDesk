'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Minus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type ProgressRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  plan: string;
  adherence: 'on_track' | 'slipping' | 'at_risk';
  lastLogLabel: string;
  trend: 'up' | 'down' | 'flat' | null;
};

const ADHERENCE_LABELS = { on_track: 'On track', slipping: 'Slipping', at_risk: 'At risk' } as const;
const ADHERENCE_VARIANTS = {
  on_track: 'success',
  slipping: 'warning',
  at_risk: 'destructive',
} as const;

export function ClientProgressTable({ rows }: { rows: ProgressRow[] }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Client Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No active clients yet" compact />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Adherence</TableHead>
                  <TableHead>Last Log</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clients/${row.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${row.id}`}
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>{row.plan}</TableCell>
                    <TableCell>
                      <Badge variant={ADHERENCE_VARIANTS[row.adherence]}>{ADHERENCE_LABELS[row.adherence]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.lastLogLabel}</TableCell>
                    <TableCell>
                      {row.trend === 'up' && <ArrowUp className="h-4 w-4 text-(--warning-700)" />}
                      {row.trend === 'down' && <ArrowDown className="h-4 w-4 text-(--success-700)" />}
                      {row.trend === 'flat' && <Minus className="h-4 w-4 text-muted-foreground" />}
                      {row.trend === null && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
