import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export function ProfileMenu({
  fullName,
  role,
  avatarUrl,
}: {
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center gap-2.5 px-1">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">{role}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2.5 text-foreground/70"
        render={<Link href="/settings/branding" />}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>
      <form action={logout}>
        <Button type="submit" variant="ghost" className="w-full justify-start gap-2.5 text-foreground/70">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </form>
    </div>
  );
}
