'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createClientSchema,
  type CreateClientInput,
  GENDERS,
  PLAN_TYPES,
  PLAN_TYPE_LABELS,
} from '@welldesk/shared';
import { createClientWithEnrollment } from '@/app/(dashboard)/clients/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUploader } from '@/components/ui/avatar-uploader';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const today = new Date().toISOString().slice(0, 10);

export function NewClientDialog({
  practiceId,
  trigger,
  triggerLabel = 'Add Client',
}: {
  practiceId: string;
  trigger?: React.ReactElement;
  triggerLabel?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [duplicate, setDuplicate] = useState<{ id: string; full_name: string } | null>(null);

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      fullName: '',
      dob: '',
      gender: undefined,
      phone: '',
      email: '',
      address: '',
      notes: '',
      photoUrl: null,
      planType: '1_month',
      customDurationDays: undefined,
      startDate: today,
      planAmount: 0,
      confirmDuplicate: false,
    },
  });

  const planType = form.watch('planType');

  function submit(values: CreateClientInput) {
    startTransition(async () => {
      const result = await createClientWithEnrollment(values);
      if (result?.duplicate) {
        setDuplicate(result.duplicate);
        return;
      }
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Client added');
      setOpen(false);
      setDuplicate(null);
      form.reset();
    });
  }

  function saveAnyway() {
    startTransition(async () => {
      const result = await createClientWithEnrollment({ ...form.getValues(), confirmDuplicate: true });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Client added');
      setOpen(false);
      setDuplicate(null);
      form.reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setDuplicate(null);
          form.reset();
        }
      }}
    >
      <DialogTrigger render={trigger ?? <Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>Enroll a new client and start their first plan cycle.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <AvatarUploader
              practiceId={practiceId}
              pathPrefix="client-new"
              initialUrl={null}
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
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g} className="capitalize">
                            {g}
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

            <div className="rounded-md border p-3">
              <p className="mb-3 text-sm font-medium">Enrollment</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {(value: keyof typeof PLAN_TYPE_LABELS) => PLAN_TYPE_LABELS[value] ?? value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PLAN_TYPES.map((pt) => (
                            <SelectItem key={pt} value={pt}>
                              {PLAN_TYPE_LABELS[pt]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input label="Start date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {planType === 'custom' && (
                  <FormField
                    control={form.control}
                    name="customDurationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Duration (days)"
                            type="number"
                            min={1}
                            name={field.name}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="planAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label="Plan amount"
                          type="number"
                          min={0}
                          step="0.01"
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {duplicate && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p>
                  A client named <strong>{duplicate.full_name}</strong> already has this phone or
                  email.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={isPending}
                  onClick={saveAnyway}
                >
                  Save anyway
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Add client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
