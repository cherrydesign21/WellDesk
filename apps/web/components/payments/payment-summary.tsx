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
  paid: 'bg-success/15 text-(--success-700)',
  partial: 'bg-warning/15 text-(--warning-700)',
  overdue: 'bg-destructive/15 text-destructive',
  unpaid: 'bg-muted text-muted-foreground',
};

const BORDER_CLASSES: Record<Summary['payment_status'], string> = {
  paid: 'border-l-4 border-l-success',
  partial: 'border-l-4 border-l-warning',
  overdue: 'border-l-4 border-l-destructive',
  unpaid: 'border-l-4 border-l-muted-foreground/30',
};

export function PaymentSummary({ summary }: { summary: Summary | null }) {
  if (!summary) return null;

  return (
    <Card className={BORDER_CLASSES[summary.payment_status]}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${STATUS_ICON_CLASSES[summary.payment_status]}`}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">Payments</p>
          </div>
          <Badge variant={statusVariant(summary.payment_status)} className="capitalize">
            {summary.payment_status}
          </Badge>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
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
        </div>
      </CardContent>
    </Card>
  );
}
