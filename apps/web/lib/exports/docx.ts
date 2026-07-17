import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, TextRun, WidthType } from 'docx';
import type { PlanWithMeals } from '@/lib/diet-plans';

type PracticeBranding = { name: string; tagline: string | null };

export async function renderPlanDocx(plan: PlanWithMeals, practice: PracticeBranding): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [new Paragraph({ text: practice.name, heading: HeadingLevel.HEADING_1 })];

  if (practice.tagline) {
    children.push(new Paragraph({ text: practice.tagline }));
  }

  children.push(
    new Paragraph({ text: plan.name, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
    new Paragraph({ text: `${plan.plan_date}${!plan.is_template ? ` · v${plan.version}` : ''}` })
  );

  for (const meal of plan.diet_plan_meals) {
    children.push(
      new Paragraph({ text: meal.slot_name, heading: HeadingLevel.HEADING_3, spacing: { before: 200 } })
    );

    const headerRow = new TableRow({
      children: ['Food', 'Qty', 'Cal', 'Notes'].map(
        (text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })
      ),
    });

    const itemRows = meal.diet_plan_meal_items.map(
      (item) =>
        new TableRow({
          children: [item.food_item, item.quantity ?? '', String(item.calories ?? ''), item.notes ?? ''].map(
            (text) => new TableCell({ children: [new Paragraph(text)] })
          ),
        })
    );

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...itemRows] }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
