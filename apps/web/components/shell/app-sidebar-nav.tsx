'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

export type SidebarNavItem = { href: string; label: string; icon: LucideIcon };

// A nav item whose href IS the section's home route (e.g. "/portal", or "/"
// for the dashboard) needs an exact match — every other route in that
// section is nested under it, so a plain startsWith would also light up
// "Dashboard" while looking at "/portal/diet-plans".
function isActiveHref(pathname: string, href: string, homeHref: string) {
  return href === homeHref ? pathname === href : pathname.startsWith(href);
}

function NavLink({
  item,
  collapsed,
  homeHref,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  homeHref: string;
}) {
  const pathname = usePathname();
  const isActive = isActiveHref(pathname, item.href, homeHref);
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

export function AppSidebarNav({
  items,
  bottomItems,
  collapsed = false,
  homeHref = '/',
}: {
  items: SidebarNavItem[];
  bottomItems?: SidebarNavItem[];
  collapsed?: boolean;
  homeHref?: string;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <NavLink key={item.href} item={item} collapsed={collapsed} homeHref={homeHref} />
      ))}
      {bottomItems && bottomItems.length > 0 && (
        <div className="mt-auto space-y-1">
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} homeHref={homeHref} />
          ))}
        </div>
      )}
    </nav>
  );
}
