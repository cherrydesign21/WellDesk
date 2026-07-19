'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { suspendPractice, unsuspendPractice, deletePractice } from '@/app/admin/practices/[practiceId]/actions';
import { Button } from '@/components/ui/button';

export function PracticeActions({ practiceId, isSuspended }: { practiceId: string; isSuspended: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleSuspend() {
    const action = isSuspended ? unsuspendPractice : suspendPractice;
    const confirmMsg = isSuspended
      ? 'Restore access for this practice?'
      : 'Suspend this practice? Its dietitian(s) and clients will lose access immediately.';
    if (!window.confirm(confirmMsg)) return;
    startTransition(async () => {
      const result = await action(practiceId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isSuspended ? 'Practice restored' : 'Practice suspended');
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        'Permanently delete this practice? This removes every client, diet plan, payment, and login under it. This cannot be undone.'
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deletePractice(practiceId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggleSuspend}>
        {isSuspended ? 'Unsuspend' : 'Suspend'}
      </Button>
      <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
        Delete Practice
      </Button>
    </div>
  );
}
