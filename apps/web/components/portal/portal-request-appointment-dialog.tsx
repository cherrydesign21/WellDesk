'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Video, Users as UsersIcon, Phone, CalendarPlus } from 'lucide-react';
import {
  appointmentRequestSchema,
  type AppointmentRequestInput,
  todayISO,
  APPOINTMENT_MODES,
  APPOINTMENT_MODE_LABELS,
} from '@welldesk/shared';
import { requestAppointment } from '@/app/portal/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogBody,
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

const DEFAULT_VALUES: AppointmentRequestInput = {
  date: todayISO(),
  time: '10:00',
  mode: 'in_person',
  notes: '',
};

export function PortalRequestAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AppointmentRequestInput>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function submit(values: AppointmentRequestInput) {
    startTransition(async () => {
      const result = await requestAppointment(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Request sent — your dietitian will confirm it soon');
      setOpen(false);
      form.reset(DEFAULT_VALUES);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <CalendarPlus className="h-3.5 w-3.5" />
        Request Appointment
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request an appointment</DialogTitle>
          <DialogDescription>
            Pick a preferred time — your dietitian will confirm or suggest another slot.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input label="Preferred date" type="date" {...field} />
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
                        <Input label="Preferred time" type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Anything your dietitian should know" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Sending…' : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
