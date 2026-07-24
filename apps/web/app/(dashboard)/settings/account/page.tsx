import { requireProfile } from '@/lib/auth';
import { AccountSettingsForm } from '@/components/settings/account-settings-form';

export default async function AccountSettingsPage() {
  const { user, profile } = await requireProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="text-sm text-muted-foreground">Your name, email, and password.</p>
      </div>
      <AccountSettingsForm
        fullName={profile.full_name}
        email={user.email ?? ''}
        avatarUrl={profile.avatar_url}
        practiceId={profile.practice_id}
      />
    </div>
  );
}
