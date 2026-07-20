'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { UserCheck, UserPlus } from 'lucide-react';
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
    <Card className={hasPortalAccess ? 'border-l-4 border-l-success' : 'border-l-4 border-l-muted-foreground/30'}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              hasPortalAccess ? 'bg-success/15 text-(--success-700)' : 'bg-muted text-muted-foreground'
            }`}
          >
            {hasPortalAccess ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Client Portal</p>
            <Badge variant={hasPortalAccess ? 'success' : 'outline'} className="mt-1">
              {hasPortalAccess ? 'Active' : 'Not invited'}
            </Badge>
          </div>
        </div>
        {hasPortalAccess ? (
          <Button variant="outline" size="sm" className="w-full" disabled={isPending} onClick={handleRevoke}>
            Revoke access
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full" disabled={isPending} onClick={handleInvite}>
            Invite to Portal
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
