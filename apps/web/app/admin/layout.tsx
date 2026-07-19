import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth';
import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-foreground px-4 text-background sm:px-6">
        <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <ShieldCheck className="h-5 w-5" />
          WellDesk Admin
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-background hover:bg-background/10 hover:text-background" render={<Link href="/" />}>
            Exit to dashboard
          </Button>
          <form action={logout}>
            <Button type="submit" variant="ghost" className="text-background hover:bg-background/10 hover:text-background">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
