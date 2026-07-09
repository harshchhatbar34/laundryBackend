'use client';

import { Sidebar } from './Sidebar';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-navy-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
