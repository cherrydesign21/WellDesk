import { PortalForgotPasswordForm } from '@/components/portal/portal-forgot-password-form';

export default function PortalForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <PortalForgotPasswordForm />
      </div>
    </div>
  );
}
