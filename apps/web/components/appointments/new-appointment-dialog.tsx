'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Video, Users as UsersIcon, Phone } from 'lucide-react';
import {
  appointmentSchema,
  type AppointmentInput,
  todayISO,
  APPOINTMENT_MODES,
  APPOINTMENT_MODE_LABELS,
} from '@welldesk/shared';
import { createAppointment } from '@/app/(dashboard)/appointments/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MODE_ICONS = { video: Video, in_person: UsersIcon, phone: Phone } as const;

export function NewAppointmentDialog({
  clientId,
  clients,
  defaultDate,
  trigger,
  triggerLabel = 'New Appointment',
}: {
  clientId?: string;
  clients?: { id: string; full_name: string }[];
  defaultDate?: string;
  trigger?: React.ReactElement;
  triggerLabel?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: clientId ?? '',
      date: defaultDate ?? todayISO(),
      time: '10:00',
      durationMinutes: 30,
      mode: 'in_person',
      notes: '',
    },
  });

  function submit(values: AppointmentInput) {
    startTransition(async () => {
      const result = await createAppointment(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Appointment scheduled');
      setOpen(false);
      form.reset({
        clientId: clientId ?? '',
        date: defaultDate ?? todayISO(),
        time: '10:00',
        durationMinutes: 30,
        mode: 'in_person',
        notes: '',
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule appointment</DialogTitle>
          <DialogDescription>Book a visit for this client.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            {!clientId && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="Date" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="Time" type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        label="Duration (minutes)"
                        type="number"
                        min={5}
                        step={5}
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
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: keyof typeof APPOINTMENT_MODE_LABELS) =>
                              APPOINTMENT_MODE_LABELS[value] ?? value
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPOINTMENT_MODES.map((m) => {
                          const Icon = MODE_ICONS[m];
                          return (
                            <SelectItem key={m} value={m}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5" />
                                {APPOINTMENT_MODE_LABELS[m]}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Scheduling…' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
