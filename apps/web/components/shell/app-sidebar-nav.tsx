'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

export type SidebarNavItem = { href: string; label: string; icon: LucideIcon };

function isActiveHref(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavLink({ item, collapsed }: { item: SidebarNavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = isActiveHref(pathname, item.href);
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
}: {
  items: SidebarNavItem[];
  bottomItems?: SidebarNavItem[];
  collapsed?: boolean;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <NavLink key={item.href} item={item} collapsed={collapsed} />
      ))}
      {bottomItems && bottomItems.length > 0 && (
        <div className="mt-auto space-y-1">
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      )}
    </nav>
  );
}
