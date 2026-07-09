'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { LoadingTable } from '@/components/admin/ui/LoadingTable';
import { useTenants } from '@/lib/admin-queries';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Tenant code copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="qwasho-btn-ghost p-1.5 ml-1" title="Copy tenant code">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useTenants();

  const tenants = (data?.data ?? []).filter((t: any) =>
    !search ||
    t.laundryName?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.tenantCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell>
      <TopBar title="Tenants" subtitle="Shop tenant codes and details" />
      <div className="flex-1 overflow-y-auto p-6">
        <PageHeader
          title="Tenant Codes"
          subtitle={`${tenants.length} registered tenants`}
        />

        <div className="flex items-center gap-3 mb-4">
          <SearchInput placeholder="Search by shop name, owner, code…" onChange={setSearch} />
        </div>

        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-surface-border dark:border-dark-border bg-surface-50 dark:bg-dark-100">
              <tr>
                <th className="table-head">Shop Name</th>
                <th className="table-head hidden md:table-cell">Owner</th>
                <th className="table-head">Tenant Code</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3}><LoadingTable cols={3} rows={8} /></td></tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-sm text-slate-400">
                    No tenants found {search && `for "${search}"`}
                  </td>
                </tr>
              ) : tenants.map((t: any) => (
                <tr key={t._id} className="table-row">
                  <td className="table-cell">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.laundryName ?? '—'}</p>
                  </td>
                  <td className="table-cell hidden md:table-cell text-sm text-slate-500">{t.name ?? '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm text-cyan-500 bg-cyan-500/8 px-2 py-0.5 rounded-md">
                        {t.tenantCode}
                      </span>
                      <CopyButton value={t.tenantCode} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
