import { Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type Summary = {
  plan_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_status: 'paid' | 'partial' | 'overdue' | 'unpaid';
};

function statusVariant(status: Summary['payment_status']): 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'overdue':
      return 'destructive';
    default:
      return 'outline';
  }
}

const STATUS_ICON_CLASSES: Record<Summary['payment_status'], string> = {
  paid: 'bg-success/10 text-(--success-700)',
  partial: 'bg-warning/10 text-(--warning-700)',
  overdue: 'bg-destructive/10 text-destructive',
  unpaid: 'bg-muted text-muted-foreground',
};

export function PaymentSummary({ summary }: { summary: Summary | null }) {
  if (!summary) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-6 py-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${STATUS_ICON_CLASSES[summary.payment_status]}`}
        >
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plan amount</p>
          <p className="text-lg font-semibold">{summary.plan_amount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-semibold">{summary.amount_paid}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Due</p>
          <p className="text-lg font-semibold">{summary.amount_due}</p>
        </div>
        <Badge variant={statusVariant(summary.payment_status)} className="ml-auto capitalize">
          {summary.payment_status}
        </Badge>
      </CardContent>
    </Card>
  );
}
