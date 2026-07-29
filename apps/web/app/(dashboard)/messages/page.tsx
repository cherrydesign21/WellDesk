import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getInboxSummaries } from '@/lib/messages-store';
import { MessagesInbox } from '@/components/messages/messages-inbox';

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, photo_url, phone')
    .neq('status', 'archived')
    .order('full_name');

  const summaries = await getInboxSummaries(supabase);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat directly with your clients</p>
      </div>
      <MessagesInbox
        clients={clients ?? []}
        initialSummaries={summaries}
        initialClientId={clientId}
      />
    </div>
  );
}
