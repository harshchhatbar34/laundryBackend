'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { StatCard } from '@/components/admin/ui/StatCard';
import { usePlatformStats, useOrderTrend } from '@/lib/admin-queries';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, ClipboardList, IndianRupee, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

const PERIOD_OPTIONS = [
  { label: '7 Days',  days: 7  },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState(7);

  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: trend = [], isLoading: trendLoading } = useOrderTrend(period);

  const totalOrdersInPeriod = (trend as any[]).reduce((s: number, d: any) => s + (d.orders ?? 0), 0);
  const totalRevenueInPeriod = (trend as any[]).reduce((s: number, d: any) => s + (d.revenue ?? 0), 0);

  const cards = [
    { title: 'Total Owners',     value: statsLoading ? '—' : (stats?.totalOwners   ?? 0),                   icon: UserCheck,     color: 'cyan'   as const, path: '/admin/owners'    },
    { title: 'Total Customers',  value: statsLoading ? '—' : (stats?.totalCustomers ?? 0),                   icon: Users,         color: 'green'  as const, path: '/admin/customers' },
    { title: 'Total Orders',     value: statsLoading ? '—' : (stats?.totalOrders    ?? 0),                   icon: ClipboardList, color: 'purple' as const, path: '/admin/orders'    },
    { title: 'Platform Revenue', value: statsLoading ? '—' : formatCurrency(stats?.totalRevenue ?? 0),       icon: IndianRupee,   color: 'orange' as const, path: '/admin/dashboard' },
  ];

  // Show tick labels only when data isn't too dense
  const showEveryNth = period > 14 ? 4 : 1;

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
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-500" />
              <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">
                Orders — Last {period} Days
              </h3>
            </div>

            {/* Period toggle */}
            <div className="flex items-center gap-1 bg-surface-50 dark:bg-dark-100 rounded-xl p-1">
              {PERIOD_OPTIONS.map(o => (
                <button
                  key={o.days}
                  onClick={() => setPeriod(o.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    period === o.days
                      ? 'bg-cyan-500 text-navy-950'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary row */}
          <div className="flex gap-6 mb-4 px-1">
            <div>
              <p className="text-xs text-slate-400">Orders in period</p>
              <p className="text-xl font-display font-bold text-slate-800 dark:text-white">
                {trendLoading ? '—' : totalOrdersInPeriod}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Revenue in period</p>
              <p className="text-xl font-display font-bold text-cyan-500">
                {trendLoading ? '—' : formatCurrency(totalRevenueInPeriod)}
              </p>
            </div>
          </div>

          {trendLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (trend as any[]).every((d: any) => d.orders === 0) ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <ClipboardList size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No orders in this period yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend as any[]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={showEveryNth - 1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0F2040',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#22D3EE' }}
                  formatter={(value: any, name: any) =>
                    name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders']
                  }
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fill="url(#orderGrad)"
                  dot={period <= 14 ? { r: 3, fill: '#06B6D4', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#06B6D4' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Manage Owners',  path: '/admin/owners'    },
            { label: 'View Orders',    path: '/admin/orders'    },
            { label: 'Manage Coupons', path: '/admin/coupons'   },
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
