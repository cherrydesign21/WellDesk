'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import type { NotificationItem } from '@/lib/notifications';
import type { StoredNotification } from '@/lib/notifications-store';
import { fetchProfileNotifications, markProfileNotificationsRead } from '@/app/(dashboard)/notifications-actions';
import { usePolling } from '@/lib/use-polling';
import { useRealtimeInsert } from '@/lib/use-realtime-insert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsMenu({ items, profileId }: { items: NotificationItem[]; profileId: string }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);

  function refresh() {
    fetchProfileNotifications().then(setNotifications);
  }

  usePolling(refresh, 30000);
  useRealtimeInsert('activity_notifications', `recipient_profile_id=eq.${profileId}`, refresh);

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const count = unreadCount + items.length;

  function handleOpenChange(open: boolean) {
    if (open && unreadCount > 0) {
      markProfileNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative rounded-full border border-border bg-card" />}
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold">Recent activity</div>
            {notifications.slice(0, 8).map((n) => (
              <DropdownMenuItem key={n.id} render={<Link href={n.href ?? '#'} />}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {!n.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    <p className="truncate font-medium">{n.title}</p>
                  </div>
                  {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                  <p className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

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
