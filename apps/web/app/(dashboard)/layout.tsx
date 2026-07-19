import Link from 'next/link';
import { CURATED_FONTS } from '@welldesk/shared';
import { requireProfile } from '@/lib/auth';
import { buildBrandColorVars } from '@/lib/brand-colors';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { ProfileMenu } from '@/components/dashboard/profile-menu';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const practiceName = profile.practices?.name ?? 'WellDesk';
  const logoUrl = profile.practices?.logo_url as string | null | undefined;
  const primaryColor = profile.practices?.primary_color as string | null | undefined;
  const fontChoiceId = profile.practices?.font_choice as string | null | undefined;

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
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          WellDesk
        </Link>
        <ProfileMenu fullName={profile.full_name} role={profile.role} avatarUrl={profile.avatar_url} />
      </header>

      <div
        className="flex flex-1"
        style={{ ...(brandVars as React.CSSProperties), fontFamily: font?.stack }}
      >
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/20 p-4 md:flex">
          <div className="mb-6 flex flex-col items-center gap-2 px-2 pt-2 text-center">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-16 w-16 rounded object-contain" />
            )}
            <p className="font-semibold">{practiceName}</p>
          </div>
          <SidebarNav />
        </aside>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>

      <DashboardFooter />
    </div>
  );
}
