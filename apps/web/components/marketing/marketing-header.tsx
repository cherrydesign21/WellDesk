import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#eee8da] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <BrandLogo className="h-7 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#3c1d0c]/80 md:flex">
          <Link href="/" className="hover:text-[#3c1d0c]">Home</Link>
          <Link href="/#features" className="hover:text-[#3c1d0c]">Features</Link>
          <Link href="/#faq" className="hover:text-[#3c1d0c]">FAQ</Link>
          <Link href="/contact" className="hover:text-[#3c1d0c]">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#3c1d0c]/80 hover:text-[#3c1d0c]">
            Log in
          </Link>
          <Button variant="brand" size="sm" render={<Link href="/register" />}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
