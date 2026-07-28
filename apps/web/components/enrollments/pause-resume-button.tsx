'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Pause, Play } from 'lucide-react';
import { pauseEnrollment, resumeEnrollment } from '@/app/(dashboard)/clients/[clientId]/enrollments/actions';

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
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
    >
      {status === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      {status === 'paused' ? 'Resume' : 'Pause'}
    </button>
  );
}
