import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getNotifications } from '@/lib/notifications';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { ProfileMenu } from '@/components/dashboard/profile-menu';
import { ClientSearch } from '@/components/dashboard/client-search';
import { NotificationsMenu } from '@/components/dashboard/notifications-menu';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { DashboardThemeBody } from '@/components/dashboard/dashboard-theme-body';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const practiceName = profile.practices?.name ?? 'WellDesk';
  const logoUrl = profile.practices?.logo_url as string | null | undefined;

  const supabase = await createClient();
  const notifications = await getNotifications(supabase);

  return (
    <div className="dashboard-theme flex h-svh w-full bg-background">
      <DashboardThemeBody />
      <DashboardSidebar practiceName={practiceName} logoUrl={logoUrl} />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <div className="hidden flex-1 sm:flex">
            <ClientSearch />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsMenu items={notifications} />
            <ProfileMenu
              fullName={profile.full_name}
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
