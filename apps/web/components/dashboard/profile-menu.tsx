'use client';

import Link from 'next/link';
import { Settings, Palette, LogOut, ChevronDown } from 'lucide-react';
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
  role,
  avatarUrl,
}: {
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto gap-2 px-2 py-1.5" />}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </div>
        )}
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">{role}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
