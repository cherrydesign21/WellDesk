import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const practiceName = profile.practices?.name ?? 'WellDesk';
  const logoUrl = profile.practices?.logo_url as string | null | undefined;

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 flex-col border-r bg-muted/20 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
          )}
          <div>
            <p className="text-lg font-semibold">{practiceName}</p>
            <p className="text-sm text-muted-foreground">{profile.full_name}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
          <Link
            href="/clients"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Clients
          </Link>
          <Link
            href="/diet-plans/templates"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Diet Plan Templates
          </Link>
          <Link
            href="/payments"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Payments
          </Link>
          <Link
            href="/settings/branding"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Branding
          </Link>
        </nav>
        <form action={logout}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            Log out
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
