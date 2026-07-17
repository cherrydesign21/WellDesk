import * as XLSX from 'xlsx';
import type { PlanWithMeals } from '@/lib/diet-plans';

export function renderPlanXlsx(plan: PlanWithMeals): Buffer {
  const rows: (string | number)[][] = [['Meal', 'Food Item', 'Quantity', 'Calories', 'Notes']];

  for (const meal of plan.diet_plan_meals) {
    for (const item of meal.diet_plan_meal_items) {
      rows.push([meal.slot_name, item.food_item, item.quantity ?? '', item.calories ?? '', item.notes ?? '']);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 30 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, (plan.name || 'Diet Plan').slice(0, 31));

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
