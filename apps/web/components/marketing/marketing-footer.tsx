import Link from 'next/link';
import { Mail } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export function MarketingFooter() {
  return (
    <footer className="mt-auto bg-[#151a01] py-16 text-white/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:justify-between">
        <div className="max-w-sm space-y-5">
          <Link href="/">
            <BrandLogo className="h-7 w-auto" invert />
          </Link>
          <p className="text-sm leading-relaxed">
            Helping dietitians run calmer practices — clients, appointments, plans and progress in one place,
            without the admin drag.
          </p>
          <a href="mailto:singhparminder2192@gmail.com" className="flex items-center gap-2 text-sm hover:text-white">
            <Mail className="h-4 w-4" />
            singhparminder2192@gmail.com
          </a>
        </div>

        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-4">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/suggestions" className="hover:text-white">
              Suggestions
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Use
            </Link>
            <a href="https://my.welldesk.app/portal/login" className="hover:text-white">
              Client Login
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 w-full max-w-6xl px-4 text-xs text-white/50 sm:px-6">
        © {new Date().getFullYear()} WellDesk. All rights reserved.
      </div>
    </footer>
  );
}
