'use client';

import { useEffect } from 'react';

// Dialogs/Sheets/Selects/DropdownMenus portal to document.body, which sits
// outside the .app-theme wrapper div — so their CSS variables (colors,
// radius) would silently fall back to the default theme. Stamping the
// class on <body> too puts portaled content back in scope. Shared by the
// dashboard, admin panel, and client portal so all three stay in sync.
export function AppThemeBody() {
  useEffect(() => {
    document.body.classList.add('app-theme');
    return () => document.body.classList.remove('app-theme');
  }, []);

  return null;
}
