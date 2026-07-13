'use client';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { useOwner, useToggleOwner, useAdminProfile, useOwnerPayments } from '@/lib/admin-queries';
import { formatCurrency, formatDate, formatDateTime, getInitials } from '@/lib/utils';
import {
  ArrowLeft, Mail, Phone, MapPin, Store, Star,
  GitBranch, IndianRupee, Calendar, ShieldCheck, ShieldOff, QrCode, X, CreditCard, History, Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { OwnerFormSheet } from '@/components/admin/owners/OwnerFormSheet';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-surface-border/50 dark:border-dark-border/50 last:border-0">
      <span className="text-xs text-slate-400 font-medium min-w-[120px]">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-100 text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function OwnerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: owner, isLoading, isError } = useOwner(id);
  const toggleOwner = useToggleOwner();
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: admin } = useAdminProfile();
  const { data: payments = [] } = useOwnerPayments(id);

  if (isLoading) {
    return (
      <AdminShell>
        <TopBar title="Owner Detail" subtitle="Loading…" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (isError || !owner) {
    return (
      <AdminShell>
        <TopBar title="Owner Detail" subtitle="Not found" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
          <ShieldOff size={40} className="opacity-30" />
          <p className="text-sm">Owner not found or failed to load.</p>
          <Link href="/admin/owners" className="qwasho-btn-ghost text-sm">← Back to Owners</Link>
        </div>
      </AdminShell>
    );
  }

  const tenant   = owner.tenant;
  const branches = owner.branches ?? [];

  return (
    <AdminShell>
      <TopBar
        title={owner.name}
        subtitle={tenant?.laundryName ?? 'Owner Detail'}
        actions={
          <button
            onClick={() => setSheetOpen(true)}
            className="qwasho-btn-ghost text-xs gap-1.5 px-3 py-2 border border-surface-border dark:border-dark-border"
          >
            <Pencil size={13} /> Edit Details
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Back */}
        <Link href="/admin/owners" className="qwasho-btn-ghost inline-flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft size={14} /> Back to Owners
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Profile card ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="admin-card p-6 flex flex-col items-center text-center">
              {owner.photo ? (
                <img src={owner.photo} alt={owner.name} className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-500/30 mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-navy-700 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-white">{getInitials(owner.name ?? 'OW')}</span>
                </div>
              )}
              <h2 className="font-display font-bold text-slate-900 dark:text-white text-lg">{owner.name}</h2>
              <p className="text-xs text-slate-400 mb-3">{owner.email}</p>

              <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={owner.isActive ? 'active' : 'blocked'} />
                {tenant?.subscription && <StatusBadge status={tenant.subscription} />}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {owner.avgRating ? owner.avgRating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>

              {/* Block/Activate button */}
              <button
                onClick={() => setConfirmToggle(true)}
                className={`w-full text-sm font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  owner.isActive
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                    : 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20'
                }`}
              >
                {owner.isActive ? <><ShieldOff size={14} /> Block Owner</> : <><ShieldCheck size={14} /> Activate Owner</>}
              </button>
            </div>

            {/* Contact info */}
            <div className="admin-card p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Contact</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Mail size={13} className="text-cyan-500 flex-shrink-0" />
                  <span className="truncate">{owner.email}</span>
                </div>
                {owner.mobileNumber && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <Phone size={13} className="text-cyan-500 flex-shrink-0" />
                    <span>{owner.mobileNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Calendar size={13} className="text-cyan-500 flex-shrink-0" />
                  <span>Joined {formatDate(owner.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Details ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Shop / Tenant details */}
            {tenant && (
              <div className="admin-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Store size={15} className="text-cyan-500" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Shop Details</p>
                </div>
                <InfoRow label="Laundry Name"  value={tenant.laundryName} />
                <InfoRow label="Tenant Code"   value={tenant.tenantCode} />
                <InfoRow label="Subscription"  value={tenant.subscription?.toUpperCase()} />
                <InfoRow label="Monthly Fee"   value={tenant.paymentAmount != null ? formatCurrency(tenant.paymentAmount) : null} />
                <InfoRow label="Payment Mode"  value={tenant.paymentMode?.toUpperCase()} />
                {tenant.upiId && <InfoRow label="UPI ID" value={tenant.upiId} />}
              </div>
            )}

            {/* Address */}
            {tenant && (tenant.address || tenant.city) && (
              <div className="admin-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={15} className="text-cyan-500" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Address</p>
                </div>
                <InfoRow label="Address"  value={tenant.address} />
                <InfoRow label="Landmark" value={tenant.landmark} />
                <InfoRow label="City"     value={tenant.city} />
                <InfoRow label="State"    value={tenant.state} />
                <InfoRow label="Pincode"  value={tenant.pincode} />
              </div>
            )}

            {/* Branches */}
            <div className="admin-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch size={15} className="text-cyan-500" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Branches ({branches.length})
                </p>
              </div>
              {branches.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No branches added yet</p>
              ) : (
                <div className="space-y-2">
                  {branches.map((b: any) => (
                    <div key={b._id} className="flex items-center justify-between bg-surface-50 dark:bg-dark-100 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{b.name}</p>
                        {b.city && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{b.city}{b.state ? `, ${b.state}` : ''}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue summary */}
            {tenant && (
              <div className="admin-card p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <IndianRupee size={15} className="text-cyan-500" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Billing</p>
                  </div>
                  <InfoRow label="Plan"          value={tenant.subscription?.toUpperCase()} />
                  <InfoRow label="Fee"           value={tenant.paymentAmount != null ? formatCurrency(tenant.paymentAmount) : null} />
                  <InfoRow label="Payment Mode"  value={tenant.paymentMode?.toUpperCase()} />
                  {tenant.upiId && <InfoRow label="UPI" value={tenant.upiId} />}
                </div>

                {/* QR Generation Action */}
                <div className="pt-2 border-t border-surface-border/50 dark:border-dark-border/50">
                  {admin?.upiId ? (
                    <button
                      onClick={() => setShowPaymentQr(true)}
                      className="w-full text-xs font-semibold py-2 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode size={13} />
                      Collect Payment via QR
                    </button>
                  ) : (
                    <div className="text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-500 dark:text-amber-400 leading-normal">
                      Configure your UPI ID in{' '}
                      <Link href="/admin/profile" className="underline font-semibold hover:text-amber-400">
                        Profile Settings
                      </Link>{' '}
                      to collect payments via QR code.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Payment History */}
      {(payments as any[]).length > 0 && (
        <div className="px-6 pb-6">
          <div className="admin-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <History size={15} className="text-cyan-500" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Payment History ({(payments as any[]).length})
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border dark:border-dark-border">
                    <th className="text-left py-2 text-slate-400 font-medium pr-4">Date</th>
                    <th className="text-left py-2 text-slate-400 font-medium pr-4">Method</th>
                    <th className="text-left py-2 text-slate-400 font-medium pr-4">Plan</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments as any[]).map((p: any) => (
                    <tr key={p._id} className="border-b border-surface-border/50 dark:border-dark-border/50 last:border-0">
                      <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">
                        {new Date(p.paidDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${p.paymentMethod === 'upi' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-600'}`}>
                          <CreditCard size={9} />{p.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 capitalize">
                        {p.subscription?.subscriptionType ?? '—'}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmToggle}
        title={owner.isActive ? `Block ${owner.name}?` : `Activate ${owner.name}?`}
        description={
          owner.isActive
            ? 'This owner will not be able to log in until unblocked.'
            : 'This owner will be able to access the platform again.'
        }
        confirmLabel={owner.isActive ? 'Block' : 'Activate'}
        variant={owner.isActive ? 'danger' : 'warning'}
        onConfirm={() => {
          toggleOwner.mutate({ id: owner._id, isActive: !owner.isActive });
          setConfirmToggle(false);
        }}
        onCancel={() => setConfirmToggle(false)}
      />

      {/* QR Payment Dialog */}
      {showPaymentQr && tenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-50 rounded-2xl border border-surface-border dark:border-dark-border max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowPaymentQr(false)}
              className="absolute top-4 right-4 qwasho-btn-ghost p-1.5"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-4 pt-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <QrCode size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                  Collect Subscription
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Collect payment from {tenant.laundryName}
                </p>
              </div>

              {/* QR Image */}
              <div className="mx-auto w-[200px] h-[200px] bg-white p-3 rounded-2xl border border-slate-100 dark:border-dark-100 flex items-center justify-center shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=${admin?.upiId}&pn=${encodeURIComponent("Qwasho Platform")}&am=${tenant.paymentAmount}&cu=INR&tn=${encodeURIComponent(`Sub-${tenant.tenantCode}`)}`
                  )}`}
                  alt="UPI QR Code"
                  className="w-[176px] h-[176px] object-contain"
                />
              </div>

              {/* Payment Details */}
              <div className="bg-surface-50 dark:bg-dark-100 rounded-xl p-3 text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to Collect</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-200">
                    {formatCurrency(tenant.paymentAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin UPI ID</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {admin?.upiId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentQr(false)}
                className="qwasho-btn-primary w-full justify-center py-2.5 text-xs font-semibold"
              >
                Close QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Sheet */}
      <OwnerFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        owner={owner as any}
      />
    </AdminShell>
  );
}
