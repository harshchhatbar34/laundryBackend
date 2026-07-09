'use client';

import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { StatCard } from '@/components/admin/ui/StatCard';
import { usePlatformStats } from '@/lib/admin-queries';
import { formatCurrency } from '@/lib/utils';
import { Users, UserCheck, ClipboardList, IndianRupee, BarChart3, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const MOCK_REVENUE = [
  { month: 'Feb', revenue: 24000 }, { month: 'Mar', revenue: 38000 }, { month: 'Apr', revenue: 31000 },
  { month: 'May', revenue: 52000 }, { month: 'Jun', revenue: 47000 }, { month: 'Jul', revenue: 61000 },
];
const STATUS_PIE = [
  { name: 'Completed', value: 45, color: '#10B981' },
  { name: 'Pending',   value: 20, color: '#F59E0B' },
  { name: 'Processing',value: 18, color: '#8B5CF6' },
  { name: 'Cancelled', value: 17, color: '#EF4444' },
];

export default function StatsPage() {
  const qc = useQueryClient();
  const { data: stats, isLoading, isFetching } = usePlatformStats();

  return (
    <AdminShell>
      <TopBar title="Platform Stats" subtitle="Real-time platform analytics" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Analytics Overview</h2>
            <p className="text-sm text-slate-400 mt-0.5">Live platform metrics</p>
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['platform-stats'] })}
            disabled={isFetching}
            className="qwasho-btn-ghost gap-2"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Owners"    value={isLoading ? '—' : stats?.totalOwners ?? 0}    icon={UserCheck}    color="cyan"   />
          <StatCard title="Total Customers" value={isLoading ? '—' : stats?.totalCustomers ?? 0} icon={Users}        color="green"  />
          <StatCard title="Total Orders"    value={isLoading ? '—' : stats?.totalOrders ?? 0}    icon={ClipboardList} color="purple" />
          <StatCard title="Total Revenue"   value={isLoading ? '—' : formatCurrency(stats?.totalRevenue ?? 0)} icon={IndianRupee} color="orange" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue trend */}
          <div className="admin-card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} className="text-cyan-500" />
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">Revenue Trend (6 months)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MOCK_REVENUE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F2040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: unknown) => [formatCurrency(v as number), 'Revenue']}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#06B6D4" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by status donut */}
          <div className="admin-card p-5">
            <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white mb-4">Orders by Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={STATUS_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {STATUS_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F2040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
