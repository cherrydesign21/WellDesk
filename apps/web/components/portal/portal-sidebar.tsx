'use client';

import { LayoutDashboard, Settings, UtensilsCrossed } from 'lucide-react';
import { AppSidebar } from '@/components/shell/app-sidebar';
import type { SidebarNavItem } from '@/components/shell/app-sidebar-nav';

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/diet-plans', label: 'Diet Plans', icon: UtensilsCrossed },
];
const BOTTOM_ITEMS: SidebarNavItem[] = [{ href: '/portal/account', label: 'Account', icon: Settings }];

export function PortalSidebar() {
  return (
    <AppSidebar
      navItems={NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      homeHref="/portal"
      storageKey="welldesk-portal-sidebar-collapsed"
    />
  );
}
