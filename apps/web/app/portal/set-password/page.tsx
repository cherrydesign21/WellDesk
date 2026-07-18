import { SetPasswordForm } from '@/components/portal/set-password-form';

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <SetPasswordForm />
      </div>
    </div>
  );
}
