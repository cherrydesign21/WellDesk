import { requireClient } from '@/lib/auth';
import { PortalMessageThread } from '@/components/portal/portal-message-thread';

export default async function PortalMessagesPage() {
  const { client } = await requireClient();
  const practiceName = client.practices?.name ?? 'your dietitian';
  const practicePhone = (client.practices as { contact_phone?: string | null } | null)?.contact_phone ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with {practiceName}</p>
      </div>
      <PortalMessageThread practiceName={practiceName} practicePhone={practicePhone} />
    </div>
  );
}
