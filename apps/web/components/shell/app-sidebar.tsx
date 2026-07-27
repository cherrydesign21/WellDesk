'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppSidebarNav, type SidebarNavItem } from './app-sidebar-nav';

function makeCollapseStore(storageKey: string) {
  const listeners = new Set<() => void>();

  function getSnapshot() {
    return localStorage.getItem(storageKey) === '1';
  }

  function getServerSnapshot() {
    return false;
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function setCollapsed(next: boolean) {
    localStorage.setItem(storageKey, next ? '1' : '0');
    for (const listener of listeners) listener();
  }

  return { getSnapshot, getServerSnapshot, subscribe, setCollapsed };
}

const stores = new Map<string, ReturnType<typeof makeCollapseStore>>();

function getStore(storageKey: string) {
  let store = stores.get(storageKey);
  if (!store) {
    store = makeCollapseStore(storageKey);
    stores.set(storageKey, store);
  }
  return store;
}

// Shared shell used by the dietitian dashboard, the super-admin panel, and
// the client portal — same logo, same collapse behavior, same nav-pill look
// everywhere; only the nav items and homeHref differ per area.
export function AppSidebar({
  navItems,
  bottomItems,
  homeHref = '/',
  storageKey = 'welldesk-sidebar-collapsed',
}: {
  navItems: SidebarNavItem[];
  bottomItems?: SidebarNavItem[];
  homeHref?: string;
  storageKey?: string;
}) {
  const store = getStore(storageKey);
  const collapsed = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  return (
    <aside
      className={`hidden shrink-0 flex-col bg-sidebar p-3 transition-[width] duration-200 md:flex ${
        collapsed ? 'w-20 items-center' : 'w-64'
      }`}
    >
      <Link
        href={homeHref}
        className={`mb-6 flex items-center rounded-xl px-2 py-2 ${collapsed ? 'justify-center' : ''}`}
      >
        {collapsed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/sidebar-icon.svg" alt="WellDesk" className="h-8 w-8" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/sidebar-horizontal-logo.svg" alt="WellDesk" className="h-8 w-auto" />
        )}
      </Link>

      <AppSidebarNav items={navItems} bottomItems={bottomItems} collapsed={collapsed} homeHref={homeHref} />

      <button
        type="button"
        onClick={() => store.setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`mt-4 flex items-center gap-2 rounded-full px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  );
}
