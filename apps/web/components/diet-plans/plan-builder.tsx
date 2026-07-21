'use client';

import { useTransition } from 'react';
import { useFieldArray, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { dietPlanSchema, type DietPlanInput, DEFAULT_MEAL_SLOTS } from '@welldesk/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

function todayForInput() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultMeals(): DietPlanInput['meals'] {
  return DEFAULT_MEAL_SLOTS.map((slot) => ({
    slotName: slot,
    items: [{ foodItem: '', quantity: '', calories: undefined, notes: '' }],
  }));
}

function MealSlotEditor({ control, mealIndex, onRemoveMeal }: { control: Control<DietPlanInput>; mealIndex: number; onRemoveMeal: () => void }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `meals.${mealIndex}.items`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <FormField
          control={control}
          name={`meals.${mealIndex}.slotName`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input {...field} className="text-base font-medium" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button" variant="ghost" size="icon" onClick={onRemoveMeal}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((item, itemIndex) => (
          <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] items-start gap-2">
            <FormField
              control={control}
              name={`meals.${mealIndex}.items.${itemIndex}.foodItem`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Food item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.items.${itemIndex}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Qty" {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.items.${itemIndex}.calories`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Cal"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`meals.${mealIndex}.items.${itemIndex}.notes`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Notes" {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={fields.length === 1}
              onClick={() => remove(itemIndex)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ foodItem: '', quantity: '', calories: undefined, notes: '' })}
        >
          <Plus className="h-3.5 w-3.5" /> Add food item
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlanBuilder({
  mode,
  initialName = '',
  initialPlanDate,
  initialMeals,
  submitLabel = 'Save plan',
  onSubmitAction,
  onSaved,
}: {
  mode: 'plan' | 'template';
  initialName?: string;
  initialPlanDate?: string;
  initialMeals?: DietPlanInput['meals'];
  submitLabel?: string;
  onSubmitAction: (values: DietPlanInput) => Promise<{ error?: string; id?: string }>;
  onSaved: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<DietPlanInput>({
    resolver: zodResolver(dietPlanSchema),
    defaultValues: {
      name: initialName,
      planDate: initialPlanDate ?? todayForInput(),
      meals: initialMeals ?? defaultMeals(),
    },
  });

  const { fields: mealFields, append: appendMeal, remove: removeMeal } = useFieldArray({
    control: form.control,
    name: 'meals',
  });

  function submit(values: DietPlanInput) {
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === 'template' ? 'Template saved' : 'Plan saved');
      if (result?.id) onSaved(result.id);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input label={mode === 'template' ? 'Template name' : 'Plan name'} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === 'plan' && (
            <FormField
              control={form.control}
              name="planDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input label="Date" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          {mealFields.map((meal, index) => (
            <MealSlotEditor
              key={meal.id}
              control={form.control}
              mealIndex={index}
              onRemoveMeal={() => removeMeal(index)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => appendMeal({ slotName: '', items: [{ foodItem: '', quantity: '', calories: undefined, notes: '' }] })}
        >
          <Plus className="h-4 w-4" /> Add meal slot
        </Button>

        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
