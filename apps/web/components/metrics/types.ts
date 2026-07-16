export type MetricRow = {
  id: string;
  recorded_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  blood_sugar_fasting: number | null;
  blood_sugar_post_meal: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  body_fat_pct: number | null;
  target_weight_kg: number | null;
  notes: string | null;
  bmi: number | null;
};
