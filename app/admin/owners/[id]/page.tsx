'use client';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { useOwner, useToggleOwner } from '@/lib/admin-queries';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import {
  ArrowLeft, Mail, Phone, MapPin, Store, Star,
  GitBranch, IndianRupee, Calendar, ShieldCheck, ShieldOff,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

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
              <div className="admin-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee size={15} className="text-cyan-500" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Billing</p>
                </div>
                <InfoRow label="Plan"          value={tenant.subscription?.toUpperCase()} />
                <InfoRow label="Fee"           value={tenant.paymentAmount != null ? formatCurrency(tenant.paymentAmount) : null} />
                <InfoRow label="Payment Mode"  value={tenant.paymentMode?.toUpperCase()} />
                {tenant.upiId && <InfoRow label="UPI" value={tenant.upiId} />}
              </div>
            )}

          </div>
        </div>
      </div>

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
    </AdminShell>
  );
}
