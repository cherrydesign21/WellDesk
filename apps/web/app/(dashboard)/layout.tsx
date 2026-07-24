import Link from 'next/link';
import { CURATED_FONTS } from '@welldesk/shared';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { buildBrandColorVars } from '@/lib/brand-colors';
import { getNotifications } from '@/lib/notifications';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { ProfileMenu } from '@/components/dashboard/profile-menu';
import { ClientSearch } from '@/components/dashboard/client-search';
import { NotificationsMenu } from '@/components/dashboard/notifications-menu';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const practiceName = profile.practices?.name ?? 'WellDesk';
  const logoUrl = profile.practices?.logo_url as string | null | undefined;
  const primaryColor = profile.practices?.primary_color as string | null | undefined;
  const fontChoiceId = profile.practices?.font_choice as string | null | undefined;

  const supabase = await createClient();
  const notifications = await getNotifications(supabase);

  const brandVars = buildBrandColorVars(primaryColor);
  const font = CURATED_FONTS.find((f) => f.id === fontChoiceId);

  return (
    <div className="flex min-h-svh flex-col">
      {font && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.label)}:wght@400;500;600;700&display=swap`}
        />
      )}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
          WellDesk
        </Link>
        <div className="hidden flex-1 justify-center sm:flex">
          <ClientSearch />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <NotificationsMenu items={notifications} />
          <ProfileMenu
            fullName={profile.full_name}
            role={profile.role}
            avatarUrl={profile.avatar_url}
            isSuperAdmin={profile.is_super_admin}
          />
        </div>
      </header>

      <div
        className="flex flex-1"
        style={{ ...(brandVars as React.CSSProperties), ...(font && { '--font-brand': font.stack }) } as React.CSSProperties}
      >
        <DashboardSidebar practiceName={practiceName} logoUrl={logoUrl} />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>

      <DashboardFooter />
    </div>
  );
}
