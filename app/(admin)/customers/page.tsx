'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { LoadingTable } from '@/components/admin/ui/LoadingTable';
import { useCustomers } from '@/lib/admin-queries';
import { formatDate, getInitials } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCustomers({ search, page, limit: 15 });
  const customers = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <AdminShell>
      <TopBar title="Customers" subtitle="All platform customers" />
      <div className="flex-1 overflow-y-auto p-6">
        <PageHeader
          title="Customers"
          subtitle={`${data?.pagination?.total ?? 0} registered customers`}
        />

        <div className="flex items-center gap-3 mb-4">
          <SearchInput placeholder="Search by name, email, mobile…" onChange={v => { setSearch(v); setPage(1); }} />
        </div>

        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-surface-border dark:border-dark-border bg-surface-50 dark:bg-dark-100">
              <tr>
                <th className="table-head">Customer</th>
                <th className="table-head hidden md:table-cell">Contact</th>
                <th className="table-head hidden lg:table-cell">Shop / Tenant</th>
                <th className="table-head hidden lg:table-cell">Registered</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4}><LoadingTable cols={4} rows={8} /></td></tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-sm text-slate-400">
                    No customers found {search && `for "${search}"`}
                  </td>
                </tr>
              ) : customers.map((c: any) => (
                <tr key={c._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{getInitials(c.name ?? 'CU')}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail size={11} />{c.email}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={11} />{c.mobile ?? '—'}</div>
                    </div>
                  </td>
                  <td className="table-cell hidden lg:table-cell">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{c.tenant?.shopName ?? '—'}</p>
                    <p className="text-xs font-mono text-cyan-500/70">{c.tenant?.tenantCode ?? '—'}</p>
                  </td>
                  <td className="table-cell hidden lg:table-cell text-xs text-slate-500">
                    {formatDate(c.createdAt)}
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
    </AdminShell>
  );
}
