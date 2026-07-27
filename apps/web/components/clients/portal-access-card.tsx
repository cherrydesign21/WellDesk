'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { inviteClientToPortal, revokeClientPortalAccess } from '@/app/(dashboard)/clients/[clientId]/portal/actions';
import { Button } from '@/components/ui/button';

export function PortalAccessCard({ clientId, hasPortalAccess }: { clientId: string; hasPortalAccess: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    startTransition(async () => {
      const result = await inviteClientToPortal(clientId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Invite sent');
    });
  }

  function handleRevoke() {
    if (!window.confirm('Revoke this client’s portal access?')) return;
    startTransition(async () => {
      const result = await revokeClientPortalAccess(clientId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Portal access revoked');
    });
  }

  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border bg-card px-3.5 py-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${hasPortalAccess ? 'bg-success' : 'bg-muted-foreground/40'}`} />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Client Portal{' '}
        <b className={hasPortalAccess ? 'text-(--success-700)' : 'text-foreground'}>
          {hasPortalAccess ? 'Active' : 'Not invited'}
        </b>
      </span>
      <div className="h-3.5 w-px shrink-0 bg-border" />
      {hasPortalAccess ? (
        <Button
          variant="link"
          size="xs"
          className="h-auto p-0 text-xs font-semibold text-destructive"
          disabled={isPending}
          onClick={handleRevoke}
        >
          Revoke access
        </Button>
      ) : (
        <Button
          variant="link"
          size="xs"
          className="h-auto p-0 text-xs font-semibold"
          disabled={isPending}
          onClick={handleInvite}
        >
          Invite to Portal
        </Button>
      )}
    </div>
  );
}
