'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteTemplate } from '@/app/(dashboard)/diet-plans/templates/actions';
import { Button } from '@/components/ui/button';

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteTemplate(templateId);
      if (result?.error) toast.error(result.error);
      else toast.success('Template deleted');
    });
  }

  return (
    <Button variant="ghost" size="icon" disabled={isPending} onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
