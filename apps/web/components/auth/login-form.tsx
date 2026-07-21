'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@welldesk/shared';
import { login } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await login(values);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold">Login</h1>
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
          <div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input label="Password" type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-[#A3B73A] hover:underline">
                Forgot Password
              </Link>
            </div>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" variant="brand" size="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Logging in…' : 'Sign In'}
          </Button>
          <hr className="border-border" />
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-[#A3B73A] hover:underline">
              Sign Up now
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
