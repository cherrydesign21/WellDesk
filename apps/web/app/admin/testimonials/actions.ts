'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createTestimonial(values: { quote: string; author: string }) {
  await requireSuperAdmin();
  const quote = values.quote.trim();
  const author = values.author.trim();
  if (!quote) return { error: 'Quote is required' };
  if (!author) return { error: 'Author is required' };

  const supabase = createAdminClient();
  const { error } = await supabase.from('testimonials').insert({ quote, author });
  if (error) return { error: error.message };

  revalidatePath('/admin/testimonials');
  return { success: true };
}

export async function toggleTestimonialActive(id: string, isActive: boolean) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('testimonials').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/testimonials');
  return { success: true };
}

export async function deleteTestimonial(id: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/testimonials');
  return { success: true };
}
