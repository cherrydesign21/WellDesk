'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Wallet,
  CalendarDays,
  Settings,
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/diet-plans/templates', label: 'Diet Plan Templates', icon: UtensilsCrossed },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/appointments', label: 'Appointments', icon: CalendarDays },
];

const SETTINGS_ITEM = { href: '/settings/account', label: 'Settings', icon: Settings };

function NavLink({
  item,
  collapsed,
  isActive,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
        collapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  );
}

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          collapsed={collapsed}
          isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
        />
      ))}
      <div className="mt-auto">
        <NavLink item={SETTINGS_ITEM} collapsed={collapsed} isActive={pathname.startsWith('/settings')} />
      </div>
    </nav>
  );
}
