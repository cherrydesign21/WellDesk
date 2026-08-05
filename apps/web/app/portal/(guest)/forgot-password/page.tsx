import type { Metadata } from 'next';
import { PortalForgotPasswordForm } from '@/components/portal/portal-forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset Client Portal Password',
  description: 'Reset the password for your WellDesk client portal account.',
};

export default function PortalForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <PortalForgotPasswordForm />
      </div>
    </div>
  );
}
