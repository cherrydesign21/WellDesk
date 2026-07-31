import { NextRequest, NextResponse } from 'next/server';
import { sendCheckinReminders } from '@/lib/checkin-reminders';

// Vercel Cron sends this exact header on every scheduled invocation — this
// is the only thing standing between this route and anyone on the internet
// triggering it, so a mismatch (or a missing env var) fails closed.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendCheckinReminders();
  return NextResponse.json(result);
}
