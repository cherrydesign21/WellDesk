'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { razorpaySettingsSchema, type RazorpaySettingsInput } from '@welldesk/shared';
import { updateRazorpaySettings, disconnectRazorpay } from '@/app/(dashboard)/settings/payments/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export function PaymentSettingsForm({
  isConnected,
  keyId,
  currency,
}: {
  isConnected: boolean;
  keyId: string;
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();

  const form = useForm<RazorpaySettingsInput>({
    resolver: zodResolver(razorpaySettingsSchema),
    defaultValues: { keyId: '', keySecret: '' },
  });

  function submit(values: RazorpaySettingsInput) {
    startTransition(async () => {
      const result = await updateRazorpaySettings(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Razorpay connected');
      form.reset({ keyId: '', keySecret: '' });
    });
  }

  function disconnect() {
    startDisconnect(async () => {
      const result = await disconnectRazorpay();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Razorpay disconnected — clients can no longer pay online.');
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Razorpay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-(--success-700)">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Connected — Key ID <span className="font-mono">{keyId}</span>. Clients can pay in {currency} from
                  their portal.
                </span>
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={disconnect} disabled={isDisconnecting}>
                {isDisconnecting ? 'Disconnecting…' : 'Disconnect Razorpay'}
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Find these under Settings → API Keys in your{' '}
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Razorpay dashboard
                </a>
                . Your Key Secret is stored securely and only ever used server-side.
              </p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="keyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Key ID" placeholder="rzp_live_..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="keySecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Key Secret" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Connecting…' : 'Connect Razorpay'}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
