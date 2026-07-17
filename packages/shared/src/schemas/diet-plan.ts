import { z } from 'zod';

export const dietPlanMealItemSchema = z.object({
  foodItem: z.string().trim().min(1, 'Food item is required'),
  quantity: z.string().trim().optional(),
  calories: z.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
});

export type DietPlanMealItemInput = z.infer<typeof dietPlanMealItemSchema>;

export const dietPlanMealSchema = z.object({
  slotName: z.string().trim().min(1, 'Slot name is required'),
  items: z.array(dietPlanMealItemSchema).min(1, 'Add at least one food item'),
});

export type DietPlanMealInput = z.infer<typeof dietPlanMealSchema>;

export const dietPlanSchema = z.object({
  name: z.string().trim().min(2, 'Plan name is required').max(150),
  planDate: z.string().min(1, 'Date is required'),
  meals: z.array(dietPlanMealSchema).min(1, 'Add at least one meal slot'),
});

export type DietPlanInput = z.infer<typeof dietPlanSchema>;
