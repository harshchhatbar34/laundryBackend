'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { LoadingTable } from '@/components/admin/ui/LoadingTable';
import { OrderDetailSheet } from '@/components/admin/orders/OrderDetailSheet';
import { useOrders } from '@/lib/admin-queries';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TABS = ['all', 'pending', 'accepted', 'processing', 'completed', 'cancelled'] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<unknown>(null);

  const { data, isLoading } = useOrders({
    search,
    status: status === 'all' ? undefined : status,
    page, limit: 15,
  });
  const orders = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <AdminShell>
      <TopBar title="Orders" subtitle="Platform-wide order management" />
      <div className="flex-1 overflow-y-auto p-6">
        <PageHeader title="Orders" subtitle={`${data?.pagination?.total ?? 0} total orders`} />

        {/* Status tabs */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setStatus(tab); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                status === tab
                  ? 'bg-cyan-500 text-navy-950'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-dark-100'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <SearchInput placeholder="Search order number, customer…" onChange={v => { setSearch(v); setPage(1); }} />
        </div>

        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-surface-border dark:border-dark-border bg-surface-50 dark:bg-dark-100">
              <tr>
                <th className="table-head">Order</th>
                <th className="table-head hidden md:table-cell">Customer</th>
                <th className="table-head hidden lg:table-cell">Shop</th>
                <th className="table-head">Status</th>
                <th className="table-head hidden md:table-cell">Total</th>
                <th className="table-head hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><LoadingTable cols={6} rows={8} /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : orders.map((order: any) => (
                <tr
                  key={order._id}
                  className="table-row cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="table-cell">
                    <p className="text-sm font-mono font-medium text-cyan-500">#{order.orderNumber}</p>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{order.customer?.name ?? '—'}</p>
                  </td>
                  <td className="table-cell hidden lg:table-cell">
                    <p className="text-sm text-slate-500">{order.tenant?.laundryName ?? '—'}</p>
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="table-cell hidden md:table-cell text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formatCurrency(order.totalAmount ?? 0)}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-xs text-slate-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-dark-border">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="qwasho-btn-ghost p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="qwasho-btn-ghost p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <OrderDetailSheet order={selectedOrder as any} onClose={() => setSelectedOrder(null)} />
    </AdminShell>
  );
}
