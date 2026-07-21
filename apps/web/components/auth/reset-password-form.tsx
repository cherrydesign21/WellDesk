'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { changePasswordSchema, type ChangePasswordInput } from '@welldesk/shared';
import { changePassword } from '@/app/(dashboard)/settings/account/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function onSubmit(values: ChangePasswordInput) {
    startTransition(async () => {
      const result = await changePassword(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Password updated');
      router.push('/');
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold">Set a new password</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label="New password" type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label="Confirm password" type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="brand" size="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
