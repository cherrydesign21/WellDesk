import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AuthShell } from '@/components/auth/auth-shell';

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <AuthShell heroImage="/login_hero.jpg">
      <ResetPasswordForm />
    </AuthShell>
  );
}
