'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Copy, Mail, Share2 } from 'lucide-react';
import { getOrCreateShareLink } from '@/app/(dashboard)/clients/[clientId]/diet-plans/actions';
import { Button } from '@/components/ui/button';

export function SharePlanButtons({ planId, planName }: { planId: string; planName: string }) {
  const [isPending, startTransition] = useTransition();

  function withLink(callback: (url: string) => void) {
    startTransition(async () => {
      const result = await getOrCreateShareLink(planId);
      if (result.error || !result.token) {
        toast.error(result.error ?? 'Failed to create share link');
        return;
      }
      callback(`${window.location.origin}/share/plan/${result.token}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          withLink((link) => {
            navigator.clipboard.writeText(link);
            toast.success('Link copied');
          })
        }
      >
        <Copy className="h-3.5 w-3.5" /> Copy link
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          withLink((link) => {
            const text = encodeURIComponent(`Here's your diet plan "${planName}": ${link}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
          })
        }
      >
        <Share2 className="h-3.5 w-3.5" /> WhatsApp
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          withLink((link) => {
            const subject = encodeURIComponent(`Your diet plan: ${planName}`);
            const body = encodeURIComponent(`Hi,\n\nHere's your diet plan "${planName}":\n${link}\n\n`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
          })
        }
      >
        <Mail className="h-3.5 w-3.5" /> Email
      </Button>
    </div>
  );
}
