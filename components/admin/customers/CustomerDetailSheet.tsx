'use client';

import { useCustomer } from '@/lib/admin-queries';
import { formatDate, getInitials } from '@/lib/utils';
import { X, Mail, Phone, Store, MapPin, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerDetailSheetProps {
  customerId: string | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-surface-border/50 dark:border-dark-border/50 last:border-0">
      <span className="text-xs text-slate-400 min-w-[110px]">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-100 text-right">{value}</span>
    </div>
  );
}

export function CustomerDetailSheet({ customerId, onClose }: CustomerDetailSheetProps) {
  const open = !!customerId;
  const { data: customer, isLoading } = useCustomer(customerId ?? '');

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      )}
      <div className={cn(
        'fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-dark-50 shadow-2xl z-50',
        'flex flex-col border-l border-surface-border dark:border-dark-border',
        'transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border dark:border-dark-border">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">Customer Detail</h3>
          <button onClick={onClose} className="qwasho-btn-ghost p-2"><X size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-cyan-500" />
            </div>
          ) : !customer ? (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">
              Customer not found
            </div>
          ) : (
            <>
              {/* Profile */}
              <div className="flex flex-col items-center text-center px-6 py-6 border-b border-surface-border dark:border-dark-border">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-white">{getInitials(customer.name ?? 'CU')}</span>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{customer.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{customer.email}</p>
                <span className={`mt-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                  customer.isActive
                    ? 'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-500/15 text-red-500'
                }`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact */}
              <div className="px-6 py-4 border-b border-surface-border dark:border-dark-border space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Contact</p>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Mail size={13} className="text-cyan-500 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.mobileNumber && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <Phone size={13} className="text-cyan-500 flex-shrink-0" />
                    <span>{customer.mobileNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Calendar size={13} className="text-cyan-500 flex-shrink-0" />
                  <span>Joined {formatDate(customer.createdAt)}</span>
                </div>
              </div>

              {/* Shop / Tenant */}
              {customer.tenant && (
                <div className="px-6 py-4 border-b border-surface-border dark:border-dark-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Store size={13} className="text-cyan-500" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Shop</p>
                  </div>
                  <Row label="Laundry"     value={customer.tenant.laundryName} />
                  <Row label="Tenant Code" value={customer.tenant.tenantCode} />
                  {customer.tenant.city && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                      <MapPin size={12} />
                      <span>{[customer.tenant.city, customer.tenant.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Account info */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Account</p>
                <Row label="Role"     value={customer.role} />
                <Row label="Customer ID" value={customer._id} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
