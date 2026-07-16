'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { healthMetricSchema, type HealthMetricInput, calculateBmi } from '@welldesk/shared';
import { createHealthMetric } from '@/app/(dashboard)/clients/[clientId]/actions';
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

function nowForInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function numberField(
  field: { value: number | undefined; onChange: (v: number | undefined) => void; onBlur: () => void; name: string; ref: React.Ref<HTMLInputElement> },
  props: React.ComponentProps<typeof Input>
) {
  return (
    <Input
      {...props}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      value={field.value ?? ''}
      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  );
}

export function LogMetricDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<HealthMetricInput>({
    resolver: zodResolver(healthMetricSchema),
    defaultValues: {
      recordedAt: nowForInput(),
      systolicBp: undefined,
      diastolicBp: undefined,
      bloodSugarFasting: undefined,
      bloodSugarPostMeal: undefined,
      weightKg: undefined,
      heightCm: undefined,
      waistCm: undefined,
      chestCm: undefined,
      hipsCm: undefined,
      bodyFatPct: undefined,
      targetWeightKg: undefined,
      notes: '',
    },
  });

  const weight = form.watch('weightKg');
  const height = form.watch('heightCm');
  const bmi = weight && height ? calculateBmi(weight, height) : null;

  function submit(values: HealthMetricInput) {
    startTransition(async () => {
      const result = await createHealthMetric(clientId, values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Metrics logged');
      setOpen(false);
      form.reset({ ...form.getValues(), recordedAt: nowForInput() });
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset({ recordedAt: nowForInput(), notes: '' });
      }}
    >
      <DialogTrigger render={<Button />}>Log Metrics</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log metrics</DialogTitle>
          <DialogDescription>Record whatever was measured at this visit — nothing is required.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recordedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date &amp; time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="systolicBp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Systolic BP</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', placeholder: 'mmHg' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolicBp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diastolic BP</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', placeholder: 'mmHg' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bloodSugarFasting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood sugar (fasting)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1', placeholder: 'mg/dL' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodSugarPostMeal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood sugar (post-meal)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1', placeholder: 'mg/dL' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heightCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {bmi !== null && (
              <p className="text-sm text-muted-foreground">
                BMI (calculated): <span className="font-medium text-foreground">{bmi}</span>
              </p>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="waistCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waist (cm)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chestCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chest (cm)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hipsCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hips (cm)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bodyFatPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body fat %</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetWeightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target weight (kg)</FormLabel>
                    <FormControl>{numberField(field, { type: 'number', step: '0.1' })}</FormControl>
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
                {isPending ? 'Saving…' : 'Save entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
