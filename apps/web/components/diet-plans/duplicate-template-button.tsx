'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { duplicateTemplate } from '@/app/(dashboard)/diet-plans/templates/actions';
import { Button } from '@/components/ui/button';

export function DuplicateTemplateButton({ templateId, showLabel = false }: { templateId: string; showLabel?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateTemplate(templateId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Template duplicated — rename it below');
      if (result?.id) router.push(`/diet-plans/templates/${result.id}/edit`);
    });
  }

  if (showLabel) {
    return (
      <Button variant="outline" disabled={isPending} onClick={handleDuplicate}>
        <Copy className="h-4 w-4" />
        {isPending ? 'Duplicating…' : 'Duplicate'}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" disabled={isPending} onClick={handleDuplicate} title="Duplicate">
      <Copy className="h-4 w-4" />
      <span className="sr-only">Duplicate</span>
    </Button>
  );
}
