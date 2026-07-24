'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Practices' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/dietitians', label: 'Dietitians' },
  { href: '/admin/testimonials', label: 'Testimonials' },
];

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-center gap-1 border-b bg-background px-4 sm:px-6">
      {TABS.map((tab) => {
        const isActive = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
