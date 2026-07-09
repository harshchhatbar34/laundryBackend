'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, UserCheck, ClipboardList,
  Tag, Building2, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/owners',    icon: UserCheck,       label: 'Owners'    },
  { href: '/admin/customers', icon: Users,           label: 'Customers' },
  { href: '/admin/orders',    icon: ClipboardList,   label: 'Orders'    },
  { href: '/admin/coupons',   icon: Tag,             label: 'Coupons'   },
  { href: '/admin/tenants',   icon: Building2,       label: 'Tenants'   },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin-auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-qwasho-gradient border-r border-white/5',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-cyan-glow pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        'flex items-center h-[60px] px-4 border-b border-white/5',
        collapsed ? 'justify-center' : 'gap-2.5'
      )}>
        <span className="text-2xl select-none">🫧</span>
        {!collapsed && (
          <div>
            <p className="font-display text-sm font-bold text-white tracking-wide leading-none">Qwasho</p>
            <p className="text-[10px] text-cyan-400/70 tracking-widest uppercase font-medium mt-0.5">Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn('sidebar-nav-item', active && 'active')}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {active && collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 border-t border-white/5 pt-3">
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full hover:text-danger hover:bg-danger/5"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-[72px] z-10 flex items-center justify-center w-6 h-6
                   bg-navy-800 border border-white/10 rounded-full text-slate-400
                   hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-150"
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft  size={12} />
        }
      </button>
    </aside>
  );
}
