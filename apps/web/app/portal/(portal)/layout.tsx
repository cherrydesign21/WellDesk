import { requireClient } from '@/lib/auth';
import { portalLogout } from '@/app/portal/actions';
import { Button } from '@/components/ui/button';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { client } = await requireClient();
  const practiceName = client.practices?.name ?? 'WellDesk';
  const logoUrl = client.practices?.logo_url as string | null | undefined;

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
          )}
          <div>
            <p className="text-lg font-semibold">{practiceName}</p>
            <p className="text-sm text-muted-foreground">{client.full_name}</p>
          </div>
        </div>
        <form action={portalLogout}>
          <Button type="submit" variant="ghost">
            Log out
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}
