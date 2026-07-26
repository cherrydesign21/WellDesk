'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  clientAccountSettingsSchema,
  changePasswordSchema,
  type ClientAccountSettingsInput,
  type ChangePasswordInput,
} from '@welldesk/shared';
import { updateClientPhone, changeClientPassword, updateClientPhoto } from '@/app/portal/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUploader } from '@/components/ui/avatar-uploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export function PortalAccountSettingsForm({
  email,
  phone,
  photoUrl,
  practiceId,
}: {
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  practiceId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isChangingPassword, startPasswordTransition] = useTransition();

  function handlePhotoUploaded(url: string | null) {
    startTransition(async () => {
      const result = await updateClientPhoto(url);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(url ? 'Photo updated' : 'Photo removed');
    });
  }

  const profileForm = useForm<ClientAccountSettingsInput>({
    resolver: zodResolver(clientAccountSettingsSchema),
    defaultValues: { phone: phone ?? '' },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function submitPhone(values: ClientAccountSettingsInput) {
    startTransition(async () => {
      const result = await updateClientPhone(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Account updated');
    });
  }

  function submitPassword(values: ChangePasswordInput) {
    startPasswordTransition(async () => {
      const result = await changeClientPassword(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Password changed');
      passwordForm.reset({ password: '', confirmPassword: '' });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <AvatarUploader
              practiceId={practiceId}
              pathPrefix="portal-avatar"
              initialUrl={photoUrl}
              onUploaded={handlePhotoUploaded}
            />
          </div>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(submitPhone)} className="space-y-4">
              <FormItem>
                <Input label="Email" value={email} disabled />
              </FormItem>
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="Phone" {...field} value={field.value ?? ''} />
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
                    <FormControl>
                      <Input label="New password" type="password" {...field} />
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
                    <FormControl>
                      <Input label="Confirm new password" type="password" {...field} />
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
