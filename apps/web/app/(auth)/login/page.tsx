import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { AuthShell } from '@/components/auth/auth-shell';

export default async function LoginPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (profile) redirect('/');

  return (
    <AuthShell heroImage="/login_hero.jpg">
      <LoginForm />
    </AuthShell>
  );
}
