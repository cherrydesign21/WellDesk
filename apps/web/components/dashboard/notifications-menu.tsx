'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import type { NotificationItem } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const count = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1.5 text-sm font-semibold">Needs attention</div>
        {items.length === 0 ? (
          <div className="px-2 pb-2">
            <EmptyState icon={Bell} title="You're all caught up" compact />
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem key={item.id} render={<Link href={item.href} />}>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
