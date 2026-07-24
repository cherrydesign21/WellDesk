import { requireSuperAdmin } from '@/lib/auth';
import { AppThemeBody } from '@/components/shell/app-theme-body';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { ProfileMenu } from '@/components/dashboard/profile-menu';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSuperAdmin();

  return (
    <div className="app-theme flex h-svh w-full bg-background">
      <AppThemeBody />
      <AdminSidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-heading font-semibold">WellDesk Admin</span>
          </div>

          <div />

          <div className="flex shrink-0 items-center justify-self-end gap-2">
            <ProfileMenu fullName={profile.full_name} avatarUrl={profile.avatar_url} isSuperAdmin={profile.is_super_admin} />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
