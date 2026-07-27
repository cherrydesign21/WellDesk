'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientSchema, type ClientInput, GENDERS } from '@welldesk/shared';
import { updateClient } from '@/app/(dashboard)/clients/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUploader } from '@/components/ui/avatar-uploader';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export type EditableClient = {
  id: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  photo_url: string | null;
  diet_type: string | null;
};

export function EditClientDialog({
  client,
  practiceId,
  open,
  onOpenChange,
}: {
  client: EditableClient | null;
  practiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: '',
      dob: '',
      gender: undefined,
      phone: '',
      email: '',
      address: '',
      notes: '',
      photoUrl: null,
      dietType: '',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        fullName: client.full_name,
        dob: client.dob ?? '',
        gender: (client.gender as ClientInput['gender']) ?? undefined,
        phone: client.phone ?? '',
        email: client.email ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
        photoUrl: client.photo_url ?? null,
        dietType: client.diet_type ?? '',
      });
    }
  }, [client, form]);

  function submit(values: ClientInput) {
    if (!client) return;
    startTransition(async () => {
      const result = await updateClient(client.id, values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Client updated');
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Update {client?.full_name}&apos;s details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-1 flex-col overflow-hidden">
          <DialogBody className="space-y-4">
            <AvatarUploader
              key={client?.id}
              practiceId={practiceId}
              pathPrefix={`client-${client?.id ?? 'new'}`}
              initialUrl={client?.photo_url}
              onUploaded={(url) => form.setValue('photoUrl', url)}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input label="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="Email" type="email" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="Date of birth" type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: keyof typeof GENDER_LABELS | null) =>
                              value ? (GENDER_LABELS[value] ?? value) : 'Select'
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {GENDER_LABELS[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dietType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input label="Diet type" placeholder="e.g. Low-Carb, Vegetarian" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </DialogBody>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
