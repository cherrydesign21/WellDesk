'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function suspendPractice(practiceId: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('practices')
    .update({ suspended_at: new Date().toISOString() })
    .eq('id', practiceId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/practices/${practiceId}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function unsuspendPractice(practiceId: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('practices').update({ suspended_at: null }).eq('id', practiceId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/practices/${practiceId}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function updatePracticeInfo(practiceId: string, values: { name: string; tagline: string }) {
  await requireSuperAdmin();
  if (!values.name.trim()) return { error: 'Practice name is required' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('practices')
    .update({ name: values.name.trim(), tagline: values.tagline.trim() || null })
    .eq('id', practiceId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/practices/${practiceId}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function deletePractice(practiceId: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const [{ data: profiles }, { data: clients }] = await Promise.all([
    supabase.from('profiles').select('id').eq('practice_id', practiceId),
    supabase.from('clients').select('user_id').eq('practice_id', practiceId).not('user_id', 'is', null),
  ]);

  const authUserIds = [
    ...(profiles ?? []).map((p) => p.id),
    ...(clients ?? []).map((c) => c.user_id as string),
  ];

  for (const userId of authUserIds) {
    await supabase.auth.admin.deleteUser(userId);
  }

  const { error } = await supabase.from('practices').delete().eq('id', practiceId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  redirect('/admin');
}
