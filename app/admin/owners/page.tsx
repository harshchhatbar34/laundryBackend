'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { LoadingTable } from '@/components/admin/ui/LoadingTable';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { OwnerFormSheet } from '@/components/admin/owners/OwnerFormSheet';
import { useOwners, useToggleOwner } from '@/lib/admin-queries';
import { formatDate, getInitials } from '@/lib/utils';
import { Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OwnersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<unknown>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  const { data, isLoading } = useOwners({ search, page, limit: 15 });
  const toggleOwner = useToggleOwner();

  const owners = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <AdminShell>
      <TopBar title="Owners" subtitle="Manage shop owners on the platform" />
      <div className="flex-1 overflow-y-auto p-6">
        <PageHeader
          title="Shop Owners"
          subtitle={`${data?.pagination?.total ?? 0} owners registered`}
          action={
            <button onClick={() => { setEditOwner(null); setSheetOpen(true); }} className="qwasho-btn-primary">
              <Plus size={15} /> New Owner
            </button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <SearchInput placeholder="Search by name, email…" onChange={setSearch} />
        </div>

        {/* Table */}
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-surface-border dark:border-dark-border bg-surface-50 dark:bg-dark-100">
              <tr>
                <th className="table-head">Owner</th>
                <th className="table-head hidden md:table-cell">Shop / Tenant</th>
                <th className="table-head hidden lg:table-cell">Subscription</th>
                <th className="table-head hidden lg:table-cell">Registered</th>
                <th className="table-head">Status</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><LoadingTable cols={6} rows={8} /></td></tr>
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    No owners found {search && `matching "${search}"`}
                  </td>
                </tr>
              ) : owners.map((owner: any) => (
                <tr
                  key={owner._id}
                  className="table-row cursor-pointer"
                  onClick={() => router.push(`/admin/owners/${owner._id}`)}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      {owner.photo ? (
                        <img src={owner.photo} alt={owner.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-navy-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{getInitials(owner.name ?? 'OW')}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{owner.name}</p>
                        <p className="text-xs text-slate-400">{owner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{owner.laundryName ?? '—'}</p>
                    <p className="text-xs font-mono text-cyan-500/70">{owner.tenantCode ?? '—'}</p>
                  </td>
                  <td className="table-cell hidden lg:table-cell">
                    <StatusBadge status={owner.subscription ?? 'monthly'} />
                  </td>
                  <td className="table-cell hidden lg:table-cell text-slate-500 dark:text-slate-400 text-xs">
                    {formatDate(owner.createdAt)}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmToggle({ id: owner._id, name: owner.name, isActive: !owner.isActive });
                      }}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                                  transition-colors duration-200 focus:outline-none
                                  ${owner.isActive ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-dark-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                                        ${owner.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditOwner(owner);
                          setSheetOpen(true);
                        }}
                        className="qwasho-btn-ghost p-2"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-dark-border">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="qwasho-btn-ghost p-2 disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="qwasho-btn-ghost p-2 disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Owner form sheet */}
      <OwnerFormSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditOwner(null); }}
        owner={editOwner as any}
      />

      {/* Block/unblock confirmation */}
      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? `Activate ${confirmToggle?.name}?` : `Block ${confirmToggle?.name}?`}
        description={confirmToggle?.isActive
          ? 'This owner will be able to access the platform again.'
          : 'This owner will not be able to log in until unblocked.'}
        confirmLabel={confirmToggle?.isActive ? 'Activate' : 'Block'}
        variant={confirmToggle?.isActive ? 'warning' : 'danger'}
        onConfirm={() => {
          if (confirmToggle) toggleOwner.mutate({ id: confirmToggle.id, isActive: confirmToggle.isActive });
          setConfirmToggle(null);
        }}
        onCancel={() => setConfirmToggle(null)}
      />
    </AdminShell>
  );
}
