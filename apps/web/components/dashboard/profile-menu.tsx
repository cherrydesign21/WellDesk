'use client';

import Link from 'next/link';
import { Settings, Palette, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { logout } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ProfileMenu({
  fullName,
  avatarUrl,
  isSuperAdmin,
}: {
  fullName: string;
  avatarUrl?: string | null;
  isSuperAdmin?: boolean;
}) {
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';
  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-auto gap-2 rounded-full border border-border bg-card px-3 py-1.5" />}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </div>
        )}
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-sm font-semibold">Greetings! 👋</p>
          <p className="truncate text-xs text-muted-foreground">Start your day with {firstName}</p>
        </div>
        <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/settings/account" />}>
          <Settings className="h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/branding" />}>
          <Palette className="h-4 w-4" />
          Brand Settings
        </DropdownMenuItem>
        {isSuperAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem
            variant="destructive"
            render={<button type="submit" className="w-full" />}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
