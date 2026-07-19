import Link from 'next/link';

export function DashboardFooter() {
  return (
    <footer className="flex flex-col items-center justify-between gap-1 border-t px-6 py-3 text-xs text-muted-foreground sm:flex-row">
      <p>© {new Date().getFullYear()} WellDesk</p>
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
