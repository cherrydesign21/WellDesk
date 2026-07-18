'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { inviteClientToPortal, revokeClientPortalAccess } from '@/app/(dashboard)/clients/[clientId]/portal/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Client Portal</p>
          <Badge variant={hasPortalAccess ? 'default' : 'outline'} className="mt-1">
            {hasPortalAccess ? 'Active' : 'Not invited'}
          </Badge>
        </div>
        <div className="ml-auto">
          {hasPortalAccess ? (
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleRevoke}>
              Revoke access
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleInvite}>
              Invite to Portal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
