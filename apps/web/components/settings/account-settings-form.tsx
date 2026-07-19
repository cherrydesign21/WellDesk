'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  accountSettingsSchema,
  changePasswordSchema,
  type AccountSettingsInput,
  type ChangePasswordInput,
} from '@welldesk/shared';
import { updateAccountSettings, changePassword } from '@/app/(dashboard)/settings/account/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function AccountSettingsForm({ fullName, email }: { fullName: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [isChangingPassword, startPasswordTransition] = useTransition();

  const profileForm = useForm<AccountSettingsInput>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: { fullName },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function submitProfile(values: AccountSettingsInput) {
    startTransition(async () => {
      const result = await updateAccountSettings(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Account updated');
    });
  }

  function submitPassword(values: ChangePasswordInput) {
    startPasswordTransition(async () => {
      const result = await changePassword(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Password changed');
      passwordForm.reset({ password: '', confirmPassword: '' });
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(submitProfile)} className="space-y-4">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input value={email} disabled />
              </FormItem>
              <FormField
                control={profileForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
