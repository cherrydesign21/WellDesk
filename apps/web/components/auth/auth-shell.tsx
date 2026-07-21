'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Add more entries here as real testimonials come in — the carousel (dots +
// auto-rotation) is fully wired up but only shows pagination once there's
// more than one to page through.
const TESTIMONIALS = [
  {
    quote:
      'Life is more easy with this tool. Now I am able to manage clients anywhere with simple login details Thank you Welldesk',
    author: 'Ritika - Dietitian',
  },
];

export function AuthShell({ heroImage, children }: { heroImage: string; children: React.ReactNode }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (TESTIMONIALS.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const testimonial = TESTIMONIALS[active];

  return (
    <div className="flex min-h-svh items-stretch bg-white p-3 lg:p-4">
      <div className="flex w-full flex-col justify-center px-4 py-10 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-welldesk.svg" alt="WellDesk" className="h-8 w-auto" />
          </Link>
          {children}
        </div>
      </div>

      <div className="relative hidden w-1/2 overflow-hidden rounded-3xl bg-linear-to-br from-[#454E17] to-[#A3B73A] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <span className="text-5xl leading-none text-white/70">&ldquo;</span>
          <p className="mt-2 max-w-md text-base leading-relaxed">{testimonial.quote}</p>
          <p className="mt-4 font-semibold">{testimonial.author}</p>
          {TESTIMONIALS.length > 1 && (
            <div className="mt-6 flex items-center gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  className={`h-1.5 cursor-pointer rounded-full transition-all ${
                    i === active ? 'w-5 bg-[#A3B73A]' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
