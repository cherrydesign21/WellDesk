import type { PlanWithMeals } from '@/lib/diet-plans';

export function PlanView({ plan }: { plan: PlanWithMeals }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{plan.name}</h2>
        <p className="text-sm text-muted-foreground">
          {plan.plan_date}
          {!plan.is_template ? ` · v${plan.version}` : ''}
        </p>
      </div>
      <div className="space-y-4">
        {plan.diet_plan_meals.map((meal) => (
          <div key={meal.id} className="rounded-md border p-4">
            <h3 className="mb-2 font-medium">{meal.slot_name}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-1 pr-4 font-normal">Food</th>
                  <th className="pb-1 pr-4 font-normal">Qty</th>
                  <th className="pb-1 pr-4 font-normal">Cal</th>
                  <th className="pb-1 font-normal">Notes</th>
                </tr>
              </thead>
              <tbody>
                {meal.diet_plan_meal_items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-4">{item.food_item}</td>
                    <td className="py-1 pr-4">{item.quantity ?? '—'}</td>
                    <td className="py-1 pr-4">{item.calories ?? '—'}</td>
                    <td className="py-1">{item.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
