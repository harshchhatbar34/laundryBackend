'use client';

import { use } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { useOwner } from '@/lib/admin-queries';
import { formatDate, getInitials } from '@/lib/utils';
import { ArrowLeft, MapPin, Phone, Mail, Building2, Star } from 'lucide-react';
import Link from 'next/link';

export default function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: owner, isLoading } = useOwner(id);

  if (isLoading) {
    return (
      <AdminShell>
        <TopBar title="Owner Detail" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (!owner) {
    return (
      <AdminShell>
        <TopBar title="Owner Detail" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Owner not found.</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <TopBar title="Owner Detail" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5 page-enter">
        <Link href="/admin/owners" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-500 transition-colors">
          <ArrowLeft size={14} /> Back to Owners
        </Link>

        {/* Profile card */}
        <div className="admin-card p-6 flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-navy-700 flex items-center justify-center flex-shrink-0 shadow-cyan-sm">
            <span className="text-xl font-bold text-white">{getInitials(owner.name ?? 'OW')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{owner.name}</h2>
                <StatusBadge status={owner.isActive ? 'active' : 'inactive'} className="mt-1" />
              </div>
              <StatusBadge status={owner.subscription ?? 'monthly'} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Mail size={13} />{owner.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Phone size={13} />{owner.mobile ?? '—'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Building2 size={13} />{owner.tenant?.shopName ?? '—'}
              </div>
              <div className="flex items-center gap-2 text-sm font-mono text-cyan-500/80">
                {owner.tenant?.tenantCode ?? '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Branches */}
        {owner.branches?.length > 0 && (
          <div className="admin-card p-5">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm mb-3">
              Branches ({owner.branches.length})
            </h3>
            <div className="space-y-2">
              {owner.branches.map((b: any) => (
                <div key={b._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-dark-100">
                  <MapPin size={14} className="text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.address}</p>
                  </div>
                  <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Orders', value: owner.totalOrders ?? 0 },
            { label: 'Customers', value: owner.totalCustomers ?? 0 },
            { label: 'Avg Rating', value: owner.avgRating ? `${owner.avgRating.toFixed(1)} ★` : '—' },
          ].map(s => (
            <div key={s.label} className="admin-card p-4 text-center">
              <p className="stat-number text-2xl">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">Registered {formatDate(owner.createdAt)}</p>
      </div>
    </AdminShell>
  );
}
