import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const practiceName = profile.practices?.name ?? 'WellDesk';

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 flex-col border-r bg-muted/20 p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold">{practiceName}</p>
          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
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
