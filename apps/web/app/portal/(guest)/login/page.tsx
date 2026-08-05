import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentClient } from '@/lib/auth';
import { PortalLoginForm } from '@/components/portal/portal-login-form';

export const metadata: Metadata = {
  title: 'Client Portal Login',
  description: 'Sign in to your client portal to view your diet plan, log your progress, and message your dietitian.',
};

export default async function PortalLoginPage() {
  const supabase = await createClient();
  const client = await getCurrentClient(supabase);
  if (client) redirect('/portal');

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <PortalLoginForm />
      </div>
    </div>
  );
}
