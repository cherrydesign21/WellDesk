'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@welldesk/shared';
import { requestPasswordReset } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      await requestPasswordReset(values);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="mb-3 text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-[#A3B73A] hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold">Forgot Password</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label="Email" type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="brand" size="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending…' : 'Send Reset Link'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-[#A3B73A] hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
