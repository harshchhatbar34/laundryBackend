'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Bell } from 'lucide-react';
import { useAdminProfile } from '@/lib/admin-queries';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { data: admin } = useAdminProfile();

  const initials = getInitials(admin?.name ?? 'SA');
  const displayName = admin?.name ?? 'Super Admin';

  return (
    <header className="flex items-center justify-between h-[60px] px-6 border-b border-surface-border dark:border-dark-border bg-white/80 dark:bg-dark-50/80 backdrop-blur-sm flex-shrink-0">
      <div>
        <h1 className="font-display text-lg font-semibold text-slate-900 dark:text-white leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="qwasho-btn-ghost w-9 h-9 justify-center p-0"
          title="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun  size={16} className="text-yellow-400" />
            : <Moon size={16} />
          }
        </button>

        {/* Notifications placeholder */}
        <button className="qwasho-btn-ghost w-9 h-9 justify-center p-0 relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
        </button>

        {/* Admin avatar — clickable link to profile */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-2.5 pl-3 ml-1 border-l border-surface-border dark:border-dark-border
                     hover:opacity-80 transition-opacity"
          title="My Profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-navy-700 flex items-center justify-center ring-2 ring-transparent hover:ring-cyan-500/40 transition-all">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Qwasho Platform</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
