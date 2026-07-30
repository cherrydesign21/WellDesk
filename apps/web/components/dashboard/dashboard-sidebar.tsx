'use client';

import { LayoutDashboard, Users, UtensilsCrossed, Wallet, CalendarDays, MessageCircle, Settings } from 'lucide-react';
import { AppSidebar } from '@/components/shell/app-sidebar';
import type { SidebarNavItem } from '@/components/shell/app-sidebar-nav';

// Icon components are functions and can't cross the server→client props
// boundary, so each area's nav config (with its icons) has to be defined
// inside a 'use client' module like this one, not passed down from a
// Server Component layout.
const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/diet-plans/templates', label: 'Diet Plan Templates', icon: UtensilsCrossed },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
];

const BOTTOM_ITEMS: SidebarNavItem[] = [{ href: '/settings/account', label: 'Settings', icon: Settings }];

export function DashboardSidebar() {
  return (
    <AppSidebar
      navItems={NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      homeHref="/dashboard"
      storageKey="welldesk-sidebar-collapsed"
    />
  );
}
