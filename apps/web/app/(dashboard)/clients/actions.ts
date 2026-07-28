'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/auth';
import {
  createClientSchema,
  clientSchema,
  calculateExpiryDate,
  type CreateClientInput,
  type ClientInput,
} from '@welldesk/shared';

export async function searchClients(query: string) {
  const term = query.trim().replace(/[%,]/g, '');
  if (term.length < 2) return [];

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return [];

  const { data } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, photo_url')
    .neq('status', 'archived')
    .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
    .order('full_name')
    .limit(8);

  return data ?? [];
}

export async function createClientWithEnrollment(values: CreateClientInput) {
  const parsed = createClientSchema.safeParse(values);
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

  if (!data.confirmDuplicate && (data.phone || data.email)) {
    const orFilters: string[] = [];
    if (data.phone) orFilters.push(`phone.eq.${data.phone}`);
    if (data.email) orFilters.push(`email.ilike.${data.email}`);

    const { data: existing } = await supabase
      .from('clients')
      .select('id, full_name, phone, email')
      .eq('practice_id', profile.practice_id)
      .or(orFilters.join(','))
      .limit(1)
      .maybeSingle();

    if (existing) {
      const matchedFields: ('phone' | 'email')[] = [];
      if (data.phone && existing.phone === data.phone) matchedFields.push('phone');
      if (data.email && existing.email?.toLowerCase() === data.email.toLowerCase()) matchedFields.push('email');
      return {
        duplicate: { scope: 'same_practice' as const, id: existing.id, full_name: existing.full_name, matchedFields },
      };
    }

    // Not a duplicate within this practice — check across every other practice
    // too (service role, since RLS would otherwise hide other tenants' rows).
    // Seeing the same dietitian twice is fine; this is just a heads-up that
    // the person may already be a client elsewhere, so we never reveal which
    // practice or their name — only that the phone/email matches.
    const admin = createAdminClient();
    const { data: elsewhere } = await admin
      .from('clients')
      .select('phone, email')
      .neq('practice_id', profile.practice_id)
      .or(orFilters.join(','))
      .limit(1)
      .maybeSingle();

    if (elsewhere) {
      const matchedFields: ('phone' | 'email')[] = [];
      if (data.phone && elsewhere.phone === data.phone) matchedFields.push('phone');
      if (data.email && elsewhere.email?.toLowerCase() === data.email.toLowerCase()) matchedFields.push('email');
      return { duplicate: { scope: 'other_practice' as const, matchedFields } };
    }
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      practice_id: profile.practice_id,
      full_name: data.fullName,
      dob: data.dob || null,
      gender: data.gender || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      photo_url: data.photoUrl || null,
      diet_type: data.dietType || null,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (clientError || !client) {
    return { error: clientError?.message ?? 'Failed to create client' };
  }

  const expiryDate = calculateExpiryDate(data.startDate, data.planType, data.customDurationDays);

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .insert({
      practice_id: profile.practice_id,
      client_id: client.id,
      cycle_number: 1,
      plan_type: data.planType,
      custom_duration_days: data.planType === 'custom' ? data.customDurationDays : null,
      start_date: data.startDate,
      expiry_date: expiryDate,
      plan_amount: data.planAmount,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (enrollmentError) {
    return { error: enrollmentError.message };
  }

  if (data.targetWeightKg) {
    const { error: metricError } = await supabase.from('health_metrics').insert({
      practice_id: profile.practice_id,
      client_id: client.id,
      enrollment_id: enrollment?.id ?? null,
      recorded_at: new Date().toISOString(),
      target_weight_kg: data.targetWeightKg,
      created_by: profile.id,
    });
    if (metricError) {
      return { error: metricError.message };
    }
  }

  revalidatePath('/clients');
  return { success: true };
}

export async function updateClient(clientId: string, values: ClientInput) {
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase
    .from('clients')
    .update({
      full_name: data.fullName,
      dob: data.dob || null,
      gender: data.gender || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      photo_url: data.photoUrl || null,
      diet_type: data.dietType || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  return { success: true };
}

export async function archiveClient(clientId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('clients')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  return { success: true };
}

export async function reactivateClient(clientId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('clients')
    .update({ status: 'active', archived_at: null })
    .eq('id', clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  return { success: true };
}

export async function bulkArchiveClients(clientIds: string[]) {
  if (clientIds.length === 0) {
    return { error: 'No clients selected' };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('clients')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .in('id', clientIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clients');
  return { success: true };
}
