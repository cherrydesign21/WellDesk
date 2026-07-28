import { Plus } from 'lucide-react';
import { requireClient } from '@/lib/auth';
import { portalLogout } from '@/app/portal/actions';
import { AppThemeBody } from '@/components/shell/app-theme-body';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalLogMetricDialog } from '@/components/portal/portal-log-metric-dialog';
import { PortalNotificationsMenu } from '@/components/portal/portal-notifications-menu';
import { Button } from '@/components/ui/button';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { client } = await requireClient();
  const practiceName = client.practices?.name ?? 'WellDesk';
  const logoUrl = client.practices?.logo_url as string | null | undefined;

  return (
    <div className="app-theme flex h-svh w-full bg-background">
      <AppThemeBody />
      <PortalSidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain" />
            )}
            <span className="truncate font-heading font-semibold">{practiceName}</span>
          </div>

          <div />

          <div className="flex shrink-0 items-center justify-self-end gap-3">
            <PortalNotificationsMenu />
            <span className="hidden text-sm text-muted-foreground sm:inline">{client.full_name}</span>
            <form action={portalLogout}>
              <Button type="submit" variant="ghost">
                Log out
              </Button>
            </form>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <PortalLogMetricDialog
        trigger={
          <Button
            size="icon"
            className="fixed right-6 bottom-6 z-40 h-14 w-14 rounded-full shadow-lg print:hidden"
          />
        }
        triggerLabel={<Plus className="h-6 w-6" />}
      />
    </div>
  );
}
