import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export function DashboardFooter() {
  return (
    <footer className="flex flex-col items-center justify-between gap-2 border-t px-6 py-3 text-xs text-muted-foreground sm:flex-row">
      <div className="flex items-center gap-2">
        <BrandLogo className="h-4 w-auto opacity-70" />
        <span>© {new Date().getFullYear()}</span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground hover:underline">
          Terms of Use
        </Link>
      </div>
    </footer>
  );
}
