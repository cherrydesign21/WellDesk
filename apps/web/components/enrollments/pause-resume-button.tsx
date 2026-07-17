'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { pauseEnrollment, resumeEnrollment } from '@/app/(dashboard)/clients/[clientId]/enrollments/actions';
import { Button } from '@/components/ui/button';

export function PauseResumeButton({
  clientId,
  enrollmentId,
  status,
}: {
  clientId: string;
  enrollmentId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (status !== 'active' && status !== 'paused') return null;

  function handleClick() {
    startTransition(async () => {
      const action = status === 'paused' ? resumeEnrollment : pauseEnrollment;
      const result = await action(clientId, enrollmentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(status === 'paused' ? 'Plan resumed' : 'Plan paused');
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      {status === 'paused' ? 'Resume' : 'Pause'}
    </Button>
  );
}
