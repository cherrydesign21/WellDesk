import { createAdminClient } from '@/lib/supabase/admin';
import { TestimonialsManager } from '@/components/admin/testimonials-manager';

export default async function AdminTestimonialsPage() {
  const supabase = createAdminClient();

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('id, quote, author, is_active')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Testimonials</h1>
        <p className="text-sm text-muted-foreground">
          Shown in rotation on the login and signup pages. Hide one without deleting it if you want to reuse it later.
        </p>
      </div>
      <TestimonialsManager testimonials={testimonials ?? []} />
    </div>
  );
}
