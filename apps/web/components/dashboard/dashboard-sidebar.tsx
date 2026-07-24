'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';

const STORAGE_KEY = 'welldesk-sidebar-collapsed';
const listeners = new Set<() => void>();

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setCollapsedStore(next: boolean) {
  localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  for (const listener of listeners) listener();
}

export function DashboardSidebar() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <aside
      className={`hidden shrink-0 flex-col bg-sidebar p-3 transition-[width] duration-200 md:flex ${
        collapsed ? 'w-20 items-center' : 'w-64'
      }`}
    >
      <Link
        href="/"
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

      <SidebarNav collapsed={collapsed} />

      <button
        type="button"
        onClick={() => setCollapsedStore(!collapsed)}
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
