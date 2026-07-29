'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentClient } from '@/lib/auth';
import { getSiteUrl } from '@/lib/site';
import { notifyPractice, getClientNotifications, markNotificationsRead } from '@/lib/notifications-store';
import { getThreadMessages, sendMessageAsClient, markThreadRead } from '@/lib/messages-store';
import {
  loginSchema,
  forgotPasswordSchema,
  clientAccountSettingsSchema,
  changePasswordSchema,
  healthMetricSchema,
  appointmentRequestSchema,
  messageSchema,
  zonedTimeToUtcIso,
  type LoginInput,
  type ForgotPasswordInput,
  type ClientAccountSettingsInput,
  type ChangePasswordInput,
  type HealthMetricInput,
  type AppointmentRequestInput,
  type MessageInput,
} from '@welldesk/shared';

export async function portalLogin(values: LoginInput) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  redirect('/portal');
}

export async function portalLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/portal/login');
}

export async function requestPortalPasswordReset(values: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/portal/auth/callback`,
  });

  // Always report success — don't reveal whether an email is registered.
  if (error) {
    console.error('resetPasswordForEmail failed', error.message);
  }
  return { success: true };
}

export async function setPortalPassword(password: string) {
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect('/portal');
}

export async function updateClientPhone(values: ClientAccountSettingsInput) {
  const parsed = clientAccountSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { data: updated, error } = await supabase
    .from('clients')
    .update({ phone: parsed.data.phone || null })
    .eq('id', result.client.id)
    // A RLS policy mismatch updates zero rows without ever returning a
    // Postgres error — .select() lets us tell "blocked" apart from "saved".
    .select('id');

  if (error) {
    return { error: error.message };
  }
  if (!updated || updated.length === 0) {
    return { error: 'Could not save — please try again or contact your dietitian.' };
  }

  revalidatePath('/portal/account');
  return { success: true };
}

export async function updateClientPhoto(photoUrl: string | null) {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { data: updated, error } = await supabase
    .from('clients')
    .update({ photo_url: photoUrl })
    .eq('id', result.client.id)
    .select('id');

  if (error) {
    return { error: error.message };
  }
  if (!updated || updated.length === 0) {
    return { error: 'Could not save — please try again or contact your dietitian.' };
  }

  revalidatePath('/portal/account');
  return { success: true };
}

export async function changeClientPassword(values: ChangePasswordInput) {
  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function createClientHealthMetric(values: HealthMetricInput) {
  const parsed = healthMetricSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { client } = result;

  const { data: activeEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('health_metrics').insert({
    practice_id: client.practice_id,
    client_id: client.id,
    enrollment_id: activeEnrollment?.id ?? null,
    recorded_at: new Date(data.recordedAt).toISOString(),
    systolic_bp: data.systolicBp ?? null,
    diastolic_bp: data.diastolicBp ?? null,
    blood_sugar_fasting: data.bloodSugarFasting ?? null,
    blood_sugar_post_meal: data.bloodSugarPostMeal ?? null,
    weight_kg: data.weightKg ?? null,
    height_cm: data.heightCm ?? null,
    waist_cm: data.waistCm ?? null,
    chest_cm: data.chestCm ?? null,
    hips_cm: data.hipsCm ?? null,
    body_fat_pct: data.bodyFatPct ?? null,
    target_weight_kg: data.targetWeightKg ?? null,
    notes: data.notes || null,
    // health_metrics.created_by references profiles(id) — clients have no
    // profiles row, so this stays null for self-logged entries (also serves
    // as an implicit "logged by the client themselves" signal).
    created_by: null,
  });

  if (error) {
    return { error: error.message };
  }

  await notifyPractice({
    practiceId: client.practice_id,
    type: 'metric_logged',
    title: `${client.full_name} logged new numbers`,
    href: `/clients/${client.id}`,
  });

  revalidatePath('/portal');
  return { success: true };
}

export async function requestAppointment(values: AppointmentRequestInput) {
  const parsed = appointmentRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { client } = result;
  const timezone = client.practices?.timezone ?? 'Asia/Kolkata';

  const startsAt = zonedTimeToUtcIso(data.date, data.time, timezone);

  const { error } = await supabase.from('appointments').insert({
    practice_id: client.practice_id,
    client_id: client.id,
    starts_at: startsAt,
    mode: data.mode,
    notes: data.notes || null,
    status: 'requested',
  });

  if (error) {
    return { error: error.message };
  }

  await notifyPractice({
    practiceId: client.practice_id,
    type: 'appointment_requested',
    title: `${client.full_name} requested an appointment`,
    body: `${data.date} at ${data.time}`,
    href: '/appointments',
  });

  revalidatePath('/portal');
  revalidatePath('/appointments');
  revalidatePath('/');
  return { success: true };
}

export async function fetchClientNotifications() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) return [];
  return getClientNotifications(supabase);
}

export async function markClientNotificationsRead() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) return;
  await markNotificationsRead(supabase);
}

export async function fetchMyThreadMessages() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) return [];

  const messages = await getThreadMessages(supabase, result.client.id);
  await markThreadRead(supabase, result.client.id, 'client');
  return messages;
}

export async function sendClientMessage(values: MessageInput) {
  const parsed = messageSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { client } = result;

  const { error } = await sendMessageAsClient(supabase, {
    practiceId: client.practice_id,
    clientId: client.id,
    body: parsed.data.body,
  });

  if (error) {
    return { error: error.message };
  }

  await notifyPractice({
    practiceId: client.practice_id,
    type: 'message_received',
    title: `New message from ${client.full_name}`,
    body: parsed.data.body,
    href: `/messages?clientId=${client.id}`,
  });

  revalidatePath('/portal/messages');
  return { success: true };
}
