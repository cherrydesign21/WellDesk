import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getNotifications } from '@/lib/notifications';
import { AppThemeBody } from '@/components/shell/app-theme-body';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { ProfileMenu } from '@/components/dashboard/profile-menu';
import { ClientSearch } from '@/components/dashboard/client-search';
import { NotificationsMenu } from '@/components/dashboard/notifications-menu';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();
  const practiceName = profile.practices?.name ?? 'WellDesk';
  const logoUrl = profile.practices?.logo_url as string | null | undefined;

  const supabase = await createClient();
  const notifications = await getNotifications(supabase);

  return (
    <div className="app-theme flex h-svh w-full bg-background">
      <AppThemeBody />
      <DashboardSidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain" />
            )}
            <span className="truncate font-heading font-semibold">{practiceName}</span>
          </div>

          <div className="hidden justify-self-center sm:flex">
            <ClientSearch />
          </div>

          <div className="flex shrink-0 items-center justify-self-end gap-2">
            <NotificationsMenu items={notifications} />
            <ProfileMenu
              fullName={profile.full_name}
              email={user.email ?? ''}
              avatarUrl={profile.avatar_url}
              isSuperAdmin={profile.is_super_admin}
            />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>

        <DashboardFooter />
      </div>
    </div>
  );
}
