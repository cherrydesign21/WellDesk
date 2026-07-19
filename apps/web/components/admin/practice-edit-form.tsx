'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updatePracticeInfo } from '@/app/admin/practices/[practiceId]/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PracticeEditForm({
  practiceId,
  initialName,
  initialTagline,
}: {
  practiceId: string;
  initialName: string;
  initialTagline: string;
}) {
  const [name, setName] = useState(initialName);
  const [tagline, setTagline] = useState(initialTagline);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updatePracticeInfo(practiceId, { name, tagline });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Practice updated');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="practice-name">Practice name</Label>
        <Input id="practice-name" value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="practice-tagline">Tagline</Label>
        <Input id="practice-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-56" />
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
