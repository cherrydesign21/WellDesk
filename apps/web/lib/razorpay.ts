import { createHmac } from 'crypto';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
};

// amountInMajorUnits is rupees/dollars/etc — Razorpay wants the smallest unit
// (e.g. paise), so it's multiplied by 100 here rather than by every caller.
export async function createRazorpayOrder(params: {
  keyId: string;
  keySecret: string;
  amountInMajorUnits: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ order: RazorpayOrder | null; error?: string }> {
  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(params.keyId, params.keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(params.amountInMajorUnits * 100),
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[razorpay] order creation failed (${res.status}): ${body}`);
    return { order: null, error: 'Could not start the payment — please try again shortly.' };
  }

  const order = (await res.json()) as RazorpayOrder;
  return { order };
}

// Fetched (not trusted from the client) after signature verification so the
// amount actually recorded always comes from Razorpay's own record of the
// order, never from a value the browser could have tampered with.
export async function fetchRazorpayOrder(params: {
  keyId: string;
  keySecret: string;
  orderId: string;
}): Promise<RazorpayOrder | null> {
  const res = await fetch(`${RAZORPAY_API_BASE}/orders/${params.orderId}`, {
    headers: { Authorization: authHeader(params.keyId, params.keySecret) },
  });
  if (!res.ok) return null;
  return (await res.json()) as RazorpayOrder;
}

// Checkout.js returns razorpay_order_id + razorpay_payment_id + razorpay_signature
// after a successful charge. Recomputing this HMAC with our own key_secret is
// what proves the payment is real and wasn't forged client-side — this is why
// key_secret must never reach the browser. No webhook needed for this check.
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = createHmac('sha256', params.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');
  return expected === params.signature;
}
