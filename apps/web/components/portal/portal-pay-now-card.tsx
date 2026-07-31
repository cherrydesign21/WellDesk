'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { createPortalPaymentOrder, verifyPortalPayment } from '@/app/portal/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

export function PortalPayNowCard({ amountDue, currency }: { amountDue: number; currency: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  async function payNow() {
    if (!isScriptReady || !window.Razorpay) {
      toast.error('Payment is still loading — try again in a moment.');
      return;
    }

    setIsProcessing(true);
    const order = await createPortalPaymentOrder();
    if (order?.error) {
      toast.error(order.error);
      setIsProcessing(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: order.practiceName,
      description: 'Plan payment',
      order_id: order.orderId,
      prefill: { name: order.clientName, email: order.clientEmail },
      theme: { color: '#454E17' },
      handler: async (response: RazorpayResponse) => {
        const verified = await verifyPortalPayment({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        if (verified?.error) {
          toast.error(verified.error);
        } else {
          toast.success('Payment received — thank you!');
          router.refresh();
        }
        setIsProcessing(false);
      },
      modal: {
        ondismiss: () => setIsProcessing(false),
      },
    });
    razorpay.open();
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setIsScriptReady(true)} />
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning/15 text-(--warning-700)">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">
                {currency} {amountDue.toFixed(2)} due
              </p>
              <p className="text-sm text-muted-foreground">Pay securely online with Razorpay.</p>
            </div>
          </div>
          <Button onClick={payNow} disabled={isProcessing}>
            {isProcessing ? 'Opening…' : 'Pay Now'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
