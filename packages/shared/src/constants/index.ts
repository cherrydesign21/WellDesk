export const PLAN_TYPES = ['1_month', '3_month', '6_month', '1_year', 'custom'] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  '1_month': '1 Month',
  '3_month': '3 Months',
  '6_month': '6 Months',
  '1_year': '1 Year',
  custom: 'Custom',
};

export const PLAN_TYPE_DAYS: Partial<Record<PlanType, number>> = {
  '1_month': 30,
  '3_month': 90,
  '6_month': 182,
  '1_year': 365,
};

export const CLIENT_STATUSES = ['active', 'expired', 'paused', 'archived'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const PAYMENT_MODES = ['cash', 'upi', 'card', 'online', 'other'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const DEFAULT_MEAL_SLOTS = [
  'Breakfast',
  'Mid-Morning',
  'Lunch',
  'Evening Snack',
  'Dinner',
  'Bed-time',
] as const;

export const CURATED_FONTS = [
  { id: 'inter', label: 'Inter', stack: '"Inter", sans-serif' },
  { id: 'poppins', label: 'Poppins', stack: '"Poppins", sans-serif' },
  { id: 'lato', label: 'Lato', stack: '"Lato", sans-serif' },
  { id: 'merriweather', label: 'Merriweather', stack: '"Merriweather", serif' },
  { id: 'playfair', label: 'Playfair Display', stack: '"Playfair Display", serif' },
  { id: 'nunito', label: 'Nunito', stack: '"Nunito", sans-serif' },
  { id: 'roboto-mono', label: 'Roboto Mono', stack: '"Roboto Mono", monospace' },
  { id: 'work-sans', label: 'Work Sans', stack: '"Work Sans", sans-serif' },
] as const;

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const KG_PER_LB = 0.45359237;

export function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'lbs' ? weight * KG_PER_LB : weight;
}

export function fromKg(weightKg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? weightKg / KG_PER_LB : weightKg;
}

export function calculateBmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Devine formula — the standard clinical estimate of ideal body weight.
// Only meaningful above ~5ft (152.4cm); shorter heights floor at the base weight.
export function calculateIdealWeightKg(heightCm: number, gender: Gender | null | undefined): number | null {
  if (!heightCm) return null;
  const heightInches = heightCm / 2.54;
  const inchesOver5Ft = Math.max(0, heightInches - 60);
  const base = gender === 'female' ? 45.5 : 50;
  return Math.round((base + 2.3 * inchesOver5Ft) * 10) / 10;
}

export function calculateExpiryDate(startDate: string, planType: PlanType, customDurationDays?: number): string {
  const days = planType === 'custom' ? customDurationDays ?? 0 : PLAN_TYPE_DAYS[planType] ?? 0;
  const start = new Date(startDate);
  start.setDate(start.getDate() + days);
  return start.toISOString().slice(0, 10);
}

export const METRIC_FIELDS = [
  { key: 'weight_kg', label: 'Weight', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg' },
  { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg' },
  { key: 'blood_sugar_fasting', label: 'Blood Sugar (Fasting)', unit: 'mg/dL' },
  { key: 'blood_sugar_post_meal', label: 'Blood Sugar (Post-meal)', unit: 'mg/dL' },
  { key: 'waist_cm', label: 'Waist', unit: 'cm' },
  { key: 'chest_cm', label: 'Chest', unit: 'cm' },
  { key: 'hips_cm', label: 'Hips', unit: 'cm' },
  { key: 'body_fat_pct', label: 'Body Fat %', unit: '%' },
] as const;

export type MetricFieldKey = (typeof METRIC_FIELDS)[number]['key'];

export const ENROLLMENT_STATUSES = ['active', 'expired', 'paused'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// enrollments.status only flips to 'expired' when something writes it —
// there's no cron job, so treat an active cycle past its expiry_date as
// expired for display purposes without needing to persist that transition.
export function getEffectiveEnrollmentStatus(enrollment: {
  status: string;
  expiry_date: string;
}): EnrollmentStatus {
  if (enrollment.status === 'active' && enrollment.expiry_date < todayISO()) {
    return 'expired';
  }
  return enrollment.status as EnrollmentStatus;
}

export function getEffectiveClientStatus(
  clientStatus: ClientStatus,
  latestEnrollment?: { status: string; expiry_date: string } | null
): ClientStatus {
  if (clientStatus === 'archived' || clientStatus === 'paused') return clientStatus;
  if (latestEnrollment && getEffectiveEnrollmentStatus(latestEnrollment) === 'expired') {
    return 'expired';
  }
  return clientStatus;
}
