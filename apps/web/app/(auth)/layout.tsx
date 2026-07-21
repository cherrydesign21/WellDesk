import Link from 'next/link';

const TESTIMONIAL = {
  quote:
    'Life is more easy with this tool. Now I am able to manage clients anywhere with simple login details Thank you Welldesk',
  author: 'Ritika - Dietitian',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
        <img src="/hero-auth.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <span className="text-5xl leading-none text-white/70">&ldquo;</span>
          <p className="mt-2 max-w-md text-base leading-relaxed">{TESTIMONIAL.quote}</p>
          <p className="mt-4 font-semibold">{TESTIMONIAL.author}</p>
          <div className="mt-6 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-5 rounded-full bg-[#A3B73A]" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
