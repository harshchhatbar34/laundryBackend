'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { LoadingTable } from '@/components/admin/ui/LoadingTable';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { CouponFormModal } from '@/components/admin/coupons/CouponFormModal';
import { useCoupons, useDeleteCoupon } from '@/lib/admin-queries';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

export default function CouponsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<unknown>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCoupons();
  const deleteCoupon = useDeleteCoupon();

  // API returns { data: [...coupons] }
  const coupons = data?.data ?? [];

  return (
    <AdminShell>
      <TopBar title="Coupons" subtitle="Manage discount coupons" />
      <div className="flex-1 overflow-y-auto p-6">
        <PageHeader
          title="Coupons"
          subtitle={`${coupons.length} coupons`}
          action={
            <button onClick={() => { setEditCoupon(null); setModalOpen(true); }} className="qwasho-btn-primary">
              <Plus size={15} /> New Coupon
            </button>
          }
        />

        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-surface-border dark:border-dark-border bg-surface-50 dark:bg-dark-100">
              <tr>
                <th className="table-head">Code</th>
                <th className="table-head">Type</th>
                <th className="table-head">Value</th>
                <th className="table-head hidden md:table-cell">Min Order</th>
                <th className="table-head hidden md:table-cell">Expires</th>
                <th className="table-head hidden lg:table-cell">Usage</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7}><LoadingTable cols={7} rows={6} /></td></tr>
              ) : (coupons as any[]).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    <Tag size={24} className="mx-auto mb-2 opacity-30" />
                    No coupons yet. Create your first one.
                  </td>
                </tr>
              ) : (coupons as any[]).map((c: any) => (
                <tr key={c._id} className="table-row">
                  <td className="table-cell">
                    <span className="font-mono text-sm font-semibold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                      {c.code}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.type === 'percentage'
                        ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                        : 'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400'
                    }`}>
                      {c.type === 'percentage' ? '%' : '₹'} {c.type}
                    </span>
                  </td>
                  <td className="table-cell text-sm font-medium text-slate-800 dark:text-slate-100">
                    {c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}
                  </td>
                  <td className="table-cell hidden md:table-cell text-sm text-slate-500">
                    {c.minOrderAmount > 0 ? formatCurrency(c.minOrderAmount) : '—'}
                  </td>
                  <td className="table-cell hidden md:table-cell text-xs text-slate-500">
                    {c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-xs text-slate-500">
                    {c.usageCount ?? 0} / {c.maxUsage ?? '∞'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditCoupon(c); setModalOpen(true); }}
                        className="qwasho-btn-ghost p-2"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(c._id)}
                        className="qwasho-btn-ghost p-2 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CouponFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCoupon(null); }}
        coupon={editCoupon as any}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Coupon?"
        description="This action cannot be undone. The coupon will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteId) deleteCoupon.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </AdminShell>
  );
}
