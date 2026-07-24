'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Quote, Trash2 } from 'lucide-react';
import { createTestimonial, deleteTestimonial, toggleTestimonialActive } from '@/app/admin/testimonials/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';

export type TestimonialRow = { id: string; quote: string; author: string; is_active: boolean };

export function TestimonialsManager({ testimonials }: { testimonials: TestimonialRow[] }) {
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await createTestimonial({ quote, author });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Testimonial added');
      setQuote('');
      setAuthor('');
    });
  }

  function handleToggle(id: string, next: boolean) {
    startTransition(async () => {
      const result = await toggleTestimonialActive(id, next);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this testimonial? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteTestimonial(id);
      if (result?.error) toast.error(result.error);
      else toast.success('Testimonial deleted');
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a testimonial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={3}
            placeholder="Quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
          <Input placeholder="Author (e.g. Ritika - Dietitian)" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Button type="button" disabled={isPending} onClick={handleAdd}>
            {isPending ? 'Saving…' : 'Add testimonial'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {testimonials.length === 0 ? (
          <EmptyState icon={Quote} title="No testimonials yet" compact />
        ) : (
          testimonials.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm italic">&ldquo;{t.quote}&rdquo;</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{t.author}</p>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t.is_active ? 'Shown' : 'Hidden'}</span>
                    <Switch
                      checked={t.is_active}
                      disabled={isPending}
                      onCheckedChange={(checked) => handleToggle(t.id, checked)}
                    />
                    {!t.is_active && <Badge variant="outline">Hidden</Badge>}
                  </label>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
