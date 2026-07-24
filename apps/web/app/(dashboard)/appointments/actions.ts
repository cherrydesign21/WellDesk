'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { appointmentSchema, zonedTimeToUtcIso, type AppointmentInput, type AppointmentStatus } from '@welldesk/shared';

export async function createAppointment(values: AppointmentInput) {
  const parsed = appointmentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { profile } = result;
  const timezone = profile.practices?.timezone ?? 'Asia/Kolkata';

  const startsAt = zonedTimeToUtcIso(data.date, data.time, timezone);
  const endsAt = new Date(new Date(startsAt).getTime() + data.durationMinutes * 60000).toISOString();

  const { error } = await supabase.from('appointments').insert({
    practice_id: profile.practice_id,
    client_id: data.clientId,
    starts_at: startsAt,
    ends_at: endsAt,
    mode: data.mode,
    notes: data.notes || null,
    created_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/appointments');
  revalidatePath(`/clients/${data.clientId}`);
  revalidatePath('/');
  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/appointments');
  revalidatePath('/');
  return { success: true };
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/appointments');
  revalidatePath('/');
  return { success: true };
}
