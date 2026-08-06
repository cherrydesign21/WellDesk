import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export function MarketingHeader() {
  return (
    <header className="sticky top-4 z-40 mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/70 py-3 pr-3 pl-6 shadow-sm backdrop-blur-md">
        <Link href="/" className="shrink-0">
          <BrandLogo className="h-7 w-auto" />
        </Link>
        <nav className="hidden items-center gap-10 text-sm font-medium text-[#333] md:flex">
          <Link href="/" className="font-semibold text-[#454e17] hover:text-[#242b00]">
            Home
          </Link>
          <Link href="/#features" className="hover:text-[#242b00]">
            Features
          </Link>
          <Link href="/#faq" className="hover:text-[#242b00]">
            FAQ
          </Link>
          <Link href="/about" className="hover:text-[#242b00]">
            About
          </Link>
          <Link href="/contact" className="hover:text-[#242b00]">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Absolute URLs — the app lives on a different host (my.welldesk.app). */}
          <a
            href="https://my.welldesk.app/login"
            className="rounded-full px-5 py-3 text-xs font-medium tracking-wider text-[#242b00] uppercase hover:bg-black/5"
          >
            Log in
          </a>
          <a
            href="https://my.welldesk.app/register"
            className="flex items-center gap-2 rounded-full bg-[#a3b73a] px-5 py-3 text-xs font-medium tracking-wider text-[#151a01] uppercase transition-colors hover:bg-[#909f31]"
          >
            Get Started
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
