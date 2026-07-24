'use client';

import { useEffect } from 'react';

// Dialogs/Sheets/Selects/DropdownMenus portal to document.body, which sits
// outside the .dashboard-theme wrapper div — so their CSS variables (colors,
// radius) would silently fall back to the app's default theme. Stamping the
// class on <body> too puts portaled content back in scope.
export function DashboardThemeBody() {
  useEffect(() => {
    document.body.classList.add('dashboard-theme');
    return () => document.body.classList.remove('dashboard-theme');
  }, []);

  return null;
}
