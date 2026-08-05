import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getActiveTestimonials } from '@/lib/testimonials';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { AuthShell } from '@/components/auth/auth-shell';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset the password for your WellDesk dietitian account.',
};

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const testimonials = await getActiveTestimonials(supabase);

  return (
    <AuthShell heroImage="/login_hero.jpg" testimonials={testimonials}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
