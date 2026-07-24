import type { SupabaseClient } from '@supabase/supabase-js';

export type Testimonial = { id: string; quote: string; author: string };

export async function getActiveTestimonials(supabase: SupabaseClient): Promise<Testimonial[]> {
  const { data } = await supabase
    .from('testimonials')
    .select('id, quote, author')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  return data ?? [];
}
