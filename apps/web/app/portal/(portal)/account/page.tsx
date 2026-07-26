import { requireClient } from '@/lib/auth';
import { PortalAccountSettingsForm } from '@/components/portal/portal-account-settings-form';

export default async function PortalAccountPage() {
  const { client } = await requireClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="text-sm text-muted-foreground">Your photo, phone number, and password.</p>
      </div>
      <PortalAccountSettingsForm
        email={client.email ?? ''}
        phone={client.phone}
        photoUrl={client.photo_url}
        practiceId={client.practice_id}
      />
    </div>
  );
}
