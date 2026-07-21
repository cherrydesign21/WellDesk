'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { brandingSchema, type BrandingInput, CURATED_FONTS } from '@welldesk/shared';
import { updateBranding } from '@/app/(dashboard)/settings/branding/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogoUploader } from './logo-uploader';

export function BrandingForm({
  practiceId,
  initialValues,
  initialLogoUrl,
}: {
  practiceId: string;
  initialValues: BrandingInput;
  initialLogoUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BrandingInput>({
    resolver: zodResolver(brandingSchema),
    defaultValues: initialValues,
  });

  function submit(values: BrandingInput) {
    startTransition(async () => {
      const result = await updateBranding(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Branding updated');
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoUploader practiceId={practiceId} initialLogoUrl={initialLogoUrl} />
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label="Business name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label="Tagline" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="h-9 w-14 p-1" {...field} />
                      <Input {...field} className="flex-1" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fontChoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string) => CURATED_FONTS.find((f) => f.id === value)?.label ?? value}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURATED_FONTS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
