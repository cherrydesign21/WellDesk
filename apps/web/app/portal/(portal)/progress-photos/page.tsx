import { requireClient } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getProgressPhotos } from '@/lib/progress-photos-store';
import { PortalProgressPhotos } from '@/components/portal/portal-progress-photos';

export default async function PortalProgressPhotosPage() {
  const { client } = await requireClient();
  const supabase = await createClient();
  const photos = await getProgressPhotos(supabase, client.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Progress Photos</h1>
        <p className="text-sm text-muted-foreground">Track your visual progress over time</p>
      </div>
      <PortalProgressPhotos clientId={client.id} practiceId={client.practice_id} initialPhotos={photos} />
    </div>
  );
}
