'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { LoadingTable } from '@/components/admin/ui/LoadingTable';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { CouponFormModal } from '@/components/admin/coupons/CouponFormModal';
import { useCoupons, useDeleteCoupon } from '@/lib/admin-queries';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function CouponsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<unknown>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCoupons();
  const deleteCoupon = useDeleteCoupon();

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
                <th className="table-head hidden md:table-cell">Expiry</th>
                <th className="table-head hidden lg:table-cell">Usage</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7}><LoadingTable cols={7} rows={6} /></td></tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    No coupons yet. Create your first one.
                  </td>
                </tr>
              ) : coupons.map((c: any) => (
                <tr key={c._id} className="table-row">
                  <td className="table-cell">
                    <span className="font-mono text-sm font-semibold text-cyan-500 bg-cyan-500/8 px-2 py-0.5 rounded-md">
                      {c.code}
                    </span>
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={c.discountType === 'percentage' ? 'monthly' : 'onetime'} />
                    <span className="text-xs text-slate-500 ml-1">{c.discountType === 'percentage' ? '%' : '₹'}</span>
                  </td>
                  <td className="table-cell text-sm font-medium text-slate-800 dark:text-slate-100">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                  </td>
                  <td className="table-cell hidden md:table-cell text-sm text-slate-500">
                    {c.minOrderValue ? formatCurrency(c.minOrderValue) : '—'}
                  </td>
                  <td className="table-cell hidden md:table-cell text-xs text-slate-500">
                    {c.validUntil ? formatDate(c.validUntil) : 'No expiry'}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-xs text-slate-500">
                    {c.usedCount ?? 0} / {c.usageLimit ?? '∞'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditCoupon(c); setModalOpen(true); }} className="qwasho-btn-ghost p-2">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(c._id)} className="qwasho-btn-ghost p-2 hover:text-red-500">
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
