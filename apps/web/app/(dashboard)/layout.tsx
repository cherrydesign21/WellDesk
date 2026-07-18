import { requireProfile } from '@/lib/auth';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { ProfileMenu } from '@/components/dashboard/profile-menu';

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
          </div>
        </div>
        <SidebarNav />
        <ProfileMenu fullName={profile.full_name} role={profile.role} avatarUrl={profile.avatar_url} />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
