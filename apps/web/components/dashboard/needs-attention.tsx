import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export type AttentionItem = {
  id: string;
  clientId: string;
  clientName: string;
  reason: string;
  kind: 'expiring' | 'inactive' | 'overdue';
};

const KIND_DOT_CLASSES = {
  overdue: 'bg-destructive',
  expiring: 'bg-(--warning-600)',
  inactive: 'bg-(--warning-600)',
} as const;

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Needs Attention</CardTitle>
        <Link href="/clients" className="text-sm font-medium text-(--success-700) hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Nothing needs attention" compact />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/clients/${item.clientId}`}
              className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${KIND_DOT_CLASSES[item.kind]}`} />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{item.clientName}</span>{' '}
                <span className="text-muted-foreground">{item.reason}</span>
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
