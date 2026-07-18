'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Wallet,
  CalendarDays,
  Palette,
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/diet-plans/templates', label: 'Diet Plan Templates', icon: UtensilsCrossed },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/settings/branding', label: 'Branding', icon: Palette },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
