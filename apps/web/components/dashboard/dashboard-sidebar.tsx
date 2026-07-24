'use client';

import { useSyncExternalStore } from 'react';
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

export function DashboardSidebar({
  practiceName,
  logoUrl,
}: {
  practiceName: string;
  logoUrl?: string | null;
}) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r bg-sidebar p-4 transition-[width] duration-200 md:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="mb-6 flex flex-col items-center gap-2 px-2 pt-2 text-center">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-12 w-12 rounded object-contain" />
        )}
        {!collapsed && <p className="font-heading font-semibold">{practiceName}</p>}
      </div>
      <SidebarNav collapsed={collapsed} />
      <button
        type="button"
        onClick={() => setCollapsedStore(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`mt-4 flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  );
}
