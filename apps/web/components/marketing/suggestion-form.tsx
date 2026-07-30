'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { suggestionFormSchema, type SuggestionFormInput } from '@welldesk/shared';
import { submitSuggestion } from '@/app/(marketing)/suggestions/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export function SuggestionForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<SuggestionFormInput>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: { name: '', email: '', suggestion: '' },
  });

  function onSubmit(values: SuggestionFormInput) {
    startTransition(async () => {
      const result = await submitSuggestion(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-[#eee8da] p-8 text-center">
        <p className="text-lg font-semibold text-[#3c1d0c]">Thanks for the idea!</p>
        <p className="mt-2 text-sm text-[#3c1d0c]/70">We read every suggestion — appreciate you taking the time.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input label="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input label="Email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="suggestion"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="What would make WellDesk better for you?" rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="brand" size="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send suggestion'}
        </Button>
      </form>
    </Form>
  );
}
