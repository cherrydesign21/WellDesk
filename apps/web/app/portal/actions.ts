'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentClient } from '@/lib/auth';
import { getSiteUrl } from '@/lib/site';
import { notifyPractice, getClientNotifications, markNotificationsRead } from '@/lib/notifications-store';
import { getThreadMessages, sendMessageAsClient, markThreadRead } from '@/lib/messages-store';
import { getProgressPhotos } from '@/lib/progress-photos-store';
import { createRazorpayOrder, fetchRazorpayOrder, verifyRazorpaySignature } from '@/lib/razorpay';
import { getPortalPaymentDue } from '@/lib/portal-payments';
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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  // Mirror of the same check on the dietitian login — a dietitian who lands
  // on this form by mistake would otherwise authenticate successfully and
  // then get silently bounced back here by requireClient() with no
  // explanation. Route them to their actual dashboard instead.
  const { data: client } = await supabase.from('clients').select('id').eq('user_id', data.user.id).maybeSingle();
  if (!client) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
    if (profile) {
      redirect('/dashboard');
    }
    await supabase.auth.signOut();
    return { error: 'No WellDesk client account found for this email.' };
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

// Reads/writes here go through the admin client (already scoped to the
// session's own client.id at every step) rather than the RLS-bound session
// client — v_enrollment_payment_status's RLS behavior as a *view* depends on
// its owner's privileges, not necessarily the querying client, so relying on
// it here would be an unverified assumption. The admin client sidesteps that
// ambiguity entirely while every query below still filters by client.id.
export async function createPortalPaymentOrder() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { client } = result;
  const admin = createAdminClient();

  const due = await getPortalPaymentDue(client.id, client.practice_id);
  if (!due.isGatewayConnected) {
    return { error: "Online payments aren't set up yet — contact your dietitian." };
  }
  if (!due.enrollmentId) {
    return { error: 'No active plan found.' };
  }
  if (due.amountDue <= 0) {
    return { error: 'No payment due right now.' };
  }

  const { data: gateway } = await admin
    .from('practices')
    .select('razorpay_key_id, razorpay_key_secret')
    .eq('id', client.practice_id)
    .maybeSingle();

  if (!gateway?.razorpay_key_id || !gateway?.razorpay_key_secret) {
    return { error: "Online payments aren't set up yet — contact your dietitian." };
  }

  const { order, error } = await createRazorpayOrder({
    keyId: gateway.razorpay_key_id,
    keySecret: gateway.razorpay_key_secret,
    amountInMajorUnits: due.amountDue,
    currency: due.currency,
    receipt: `enr_${due.enrollmentId}_${Date.now()}`,
    notes: { clientId: client.id, enrollmentId: due.enrollmentId, practiceId: client.practice_id },
  });

  if (error || !order) {
    return { error: error ?? 'Could not start the payment.' };
  }

  return {
    success: true as const,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: gateway.razorpay_key_id,
    practiceName: client.practices?.name ?? 'Your dietitian',
    clientName: client.full_name,
    clientEmail: client.email ?? undefined,
  };
}

export async function verifyPortalPayment(params: { orderId: string; paymentId: string; signature: string }) {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { client } = result;
  const admin = createAdminClient();

  // Checkout's success handler can fire more than once (e.g. a refreshed
  // confirmation tab) — treat a repeat call for an already-recorded order as
  // a success rather than inserting a duplicate payment.
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('razorpay_order_id', params.orderId)
    .maybeSingle();
  if (existing) {
    return { success: true as const };
  }

  const { data: gateway } = await admin
    .from('practices')
    .select('razorpay_key_id, razorpay_key_secret')
    .eq('id', client.practice_id)
    .maybeSingle();

  if (!gateway?.razorpay_key_id || !gateway?.razorpay_key_secret) {
    return { error: 'Online payments are not set up.' };
  }

  const isValid = verifyRazorpaySignature({
    orderId: params.orderId,
    paymentId: params.paymentId,
    signature: params.signature,
    keySecret: gateway.razorpay_key_secret,
  });
  if (!isValid) {
    return { error: 'Payment could not be verified.' };
  }

  // Fetched fresh from Razorpay rather than trusted from the client — the
  // signature only proves order/payment IDs are genuine, not that the
  // browser didn't also send a tampered amount alongside them.
  const order = await fetchRazorpayOrder({
    keyId: gateway.razorpay_key_id,
    keySecret: gateway.razorpay_key_secret,
    orderId: params.orderId,
  });

  if (!order || order.notes.clientId !== client.id) {
    return { error: 'Payment could not be verified.' };
  }

  const { error } = await admin.from('payments').insert({
    practice_id: client.practice_id,
    client_id: client.id,
    enrollment_id: order.notes.enrollmentId,
    amount: order.amount / 100,
    payment_date: new Date().toISOString().slice(0, 10),
    mode: 'online',
    reference_no: params.paymentId,
    notes: 'Paid online via Razorpay',
    razorpay_order_id: params.orderId,
    razorpay_payment_id: params.paymentId,
  });

  if (error) {
    return { error: error.message };
  }

  await notifyPractice({
    practiceId: client.practice_id,
    type: 'payment_received',
    title: `${client.full_name} paid online`,
    body: `${order.currency} ${(order.amount / 100).toFixed(2)}`,
    href: `/clients/${client.id}`,
  });

  revalidatePath('/portal');
  return { success: true as const };
}

export async function fetchMyProgressPhotos() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) return [];
  return getProgressPhotos(supabase, result.client.id);
}

export async function addMyProgressPhoto(storagePath: string, caption?: string) {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { client } = result;

  const { error } = await supabase.from('progress_photos').insert({
    practice_id: client.practice_id,
    client_id: client.id,
    storage_path: storagePath,
    caption: caption || null,
    uploaded_by_type: 'client',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/portal/progress-photos');
  return { success: true };
}

export async function deleteMyProgressPhoto(photoId: string, storagePath: string) {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase.from('progress_photos').delete().eq('id', photoId);
  if (error) {
    return { error: error.message };
  }

  await supabase.storage.from('progress-photos').remove([storagePath]);

  revalidatePath('/portal/progress-photos');
  return { success: true };
}
