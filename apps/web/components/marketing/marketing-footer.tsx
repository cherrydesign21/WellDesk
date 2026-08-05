import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-[#eee8da]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[#3c1d0c]/60 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <BrandLogo className="h-5 w-auto opacity-80" />
          </Link>
          <span>© {new Date().getFullYear()} WellDesk</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link href="/about" className="hover:text-[#3c1d0c]">About</Link>
          <Link href="/contact" className="hover:text-[#3c1d0c]">Contact</Link>
          <Link href="/suggestions" className="hover:text-[#3c1d0c]">Suggestions</Link>
          <Link href="/privacy" className="hover:text-[#3c1d0c]">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#3c1d0c]">Terms of Use</Link>
          <a href="https://my.welldesk.app/portal/login" className="hover:text-[#3c1d0c]">Client Login</a>
        </div>
      </div>
    </footer>
  );
}
