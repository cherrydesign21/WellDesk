'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function deleteClientAdmin(clientId: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data: client } = await supabase.from('clients').select('user_id').eq('id', clientId).single();

  if (client?.user_id) {
    await supabase.auth.admin.deleteUser(client.user_id);
  }

  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) return { error: error.message };

  revalidatePath('/admin/clients');
  return { success: true };
}
