'use client';

import { LayoutDashboard } from 'lucide-react';
import { AppSidebar } from '@/components/shell/app-sidebar';
import type { SidebarNavItem } from '@/components/shell/app-sidebar-nav';

const NAV_ITEMS: SidebarNavItem[] = [{ href: '/portal', label: 'Dashboard', icon: LayoutDashboard }];

export function PortalSidebar() {
  return <AppSidebar navItems={NAV_ITEMS} homeHref="/portal" storageKey="welldesk-portal-sidebar-collapsed" />;
}
