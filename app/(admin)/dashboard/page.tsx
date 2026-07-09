'use client';

import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { StatCard } from '@/components/admin/ui/StatCard';
import { usePlatformStats } from '@/lib/admin-queries';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, ClipboardList, IndianRupee, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MOCK_TREND = [
  { day: 'Mon', orders: 12 }, { day: 'Tue', orders: 19 }, { day: 'Wed', orders: 14 },
  { day: 'Thu', orders: 27 }, { day: 'Fri', orders: 22 }, { day: 'Sat', orders: 35 }, { day: 'Sun', orders: 18 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading } = usePlatformStats();

  const cards = [
    { title: 'Total Owners',    value: isLoading ? '—' : (stats?.totalOwners ?? 0),    icon: UserCheck,      color: 'cyan'   as const, path: '/admin/owners'    },
    { title: 'Total Customers', value: isLoading ? '—' : (stats?.totalCustomers ?? 0), icon: Users,          color: 'green'  as const, path: '/admin/customers' },
    { title: 'Total Orders',    value: isLoading ? '—' : (stats?.totalOrders ?? 0),    icon: ClipboardList,  color: 'purple' as const, path: '/admin/orders'    },
    { title: 'Platform Revenue',value: isLoading ? '—' : formatCurrency(stats?.totalRevenue ?? 0), icon: IndianRupee, color: 'orange' as const, path: '/admin/stats' },
  ];

  return (
    <AdminShell>
      <TopBar title="Dashboard" subtitle="Platform overview" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(card => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              onClick={() => router.push(card.path)}
            />
          ))}
        </div>

        {/* Orders trend chart */}
        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-cyan-500" />
            <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">Orders This Week</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_TREND} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F2040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#22D3EE' }}
              />
              <Area type="monotone" dataKey="orders" stroke="#06B6D4" strokeWidth={2} fill="url(#orderGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Owners',    path: '/admin/owners'    },
            { label: 'View Orders',      path: '/admin/orders'    },
            { label: 'Manage Coupons',   path: '/admin/coupons'   },
            { label: 'Platform Stats',   path: '/admin/stats'     },
          ].map(q => (
            <button
              key={q.path}
              onClick={() => router.push(q.path)}
              className="admin-card p-4 text-left hover:shadow-card-hover hover:border-cyan-500/20 transition-all duration-150"
            >
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{q.label}</p>
              <p className="text-xs text-cyan-500 mt-1 font-medium">Open →</p>
            </button>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
