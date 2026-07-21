import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthShell } from '@/components/auth/auth-shell';

export default async function RegisterPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (profile) redirect('/');

  return (
    <AuthShell heroImage="/signup_hero.jpg">
      <RegisterForm />
    </AuthShell>
  );
}
