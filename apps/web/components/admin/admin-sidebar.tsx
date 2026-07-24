'use client';

import { Building2, Users, Stethoscope, Quote, LayoutDashboard } from 'lucide-react';
import { AppSidebar } from '@/components/shell/app-sidebar';
import type { SidebarNavItem } from '@/components/shell/app-sidebar-nav';

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/admin', label: 'Practices', icon: Building2 },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/dietitians', label: 'Dietitians', icon: Stethoscope },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
];

const BOTTOM_ITEMS: SidebarNavItem[] = [{ href: '/', label: 'Exit to Dashboard', icon: LayoutDashboard }];

export function AdminSidebar() {
  return (
    <AppSidebar
      navItems={NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      homeHref="/admin"
      storageKey="welldesk-admin-sidebar-collapsed"
    />
  );
}
