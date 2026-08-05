import type { Testimonial } from '@/lib/testimonials';
import { Reveal } from './reveal';

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="border-t border-[#eee8da]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-[#3c1d0c]">What dietitians are saying</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 80}>
              <figure className="h-full rounded-2xl border border-[#eee8da] bg-white p-6">
                <span aria-hidden className="text-4xl leading-none text-[#A3B73A]">
                  &ldquo;
                </span>
                <blockquote className="mt-2 text-sm leading-relaxed text-[#3c1d0c]/80">{t.quote}</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-[#3c1d0c]">{t.author}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
