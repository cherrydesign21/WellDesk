import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getActiveTestimonials } from '@/lib/testimonials';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthShell } from '@/components/auth/auth-shell';

export const metadata: Metadata = {
  title: 'Get Started Free',
  description: 'Create your WellDesk practice account — no credit card, no setup fees, free during early access.',
};

export default async function RegisterPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (profile) redirect('/dashboard');

  const testimonials = await getActiveTestimonials(supabase);

  return (
    <AuthShell heroImage="/signup_hero.jpg" testimonials={testimonials}>
      <RegisterForm />
    </AuthShell>
  );
}
