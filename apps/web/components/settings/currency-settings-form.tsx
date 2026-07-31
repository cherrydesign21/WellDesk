'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { CURRENCIES } from '@welldesk/shared';
import { updatePracticeCurrency } from '@/app/(dashboard)/settings/payments/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CurrencySettingsForm({ currency }: { currency: string }) {
  const [isPending, startTransition] = useTransition();

  function onChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      const result = await updatePracticeCurrency({ currency: value as (typeof CURRENCIES)[number]['code'] });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Currency updated — applies across your dashboard and client portal.');
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Currency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Used everywhere money is shown — your dashboard, client portal, and payment collection.
        </p>
        <Select value={currency} onValueChange={onChange} disabled={isPending}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
