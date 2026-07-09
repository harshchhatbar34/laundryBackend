'use client';

import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { X, User, Store, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderDetailSheetProps {
  order: any;
  onClose: () => void;
}

export function OrderDetailSheet({ order, onClose }: OrderDetailSheetProps) {
  const open = !!order;

  // All monetary values live inside order.pricing.*
  // Items: each item has { material, item, service, quantity, price }
  // payment: paymentMethod (not paymentMode), paymentStatus
  const pricing  = order?.pricing ?? {};
  const subtotal = pricing.subtotal ?? 0;
  const discount = pricing.discount ?? 0;
  const total    = pricing.total    ?? 0;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      )}
      <div className={cn(
        'fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-dark-50 shadow-2xl z-50',
        'flex flex-col border-l border-surface-border dark:border-dark-border',
        'transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {!order ? null : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border dark:border-dark-border">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Order</p>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white font-mono">
                  #{order.orderNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <button onClick={onClose} className="qwasho-btn-ghost p-2 ml-1">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Customer — populated as 'customer' (name, email) */}
              <div className="admin-card p-4 space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-cyan-500" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</p>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {order.customer?.name ?? '—'}
                </p>
                <p className="text-xs text-slate-500">{order.customer?.email ?? '—'}</p>
              </div>

              {/* Shop — tenant populated with laundryName, tenantCode */}
              <div className="admin-card p-4 space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <Store size={14} className="text-cyan-500" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shop</p>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {order.tenant?.laundryName ?? '—'}
                </p>
                <p className="text-xs font-mono text-cyan-500/70">
                  {order.tenant?.tenantCode ?? '—'}
                </p>
                {order.branch && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin size={11} />
                    {order.branch?.name}
                    {order.branch?.city ? `, ${order.branch.city}` : ''}
                  </div>
                )}
              </div>

              {/* Items — each item: { material, item, service, quantity, price }
                  'item' and 'material' are ObjectId refs (not populated in list view) */}
              {order.items?.length > 0 && (
                <div className="admin-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={14} className="text-cyan-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Items ({order.items.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">
                          {/* material/item may be ObjectIds if not populated — show index */}
                          {it.material?.name ?? it.item?.name ?? `Item ${i + 1}`}
                          {it.service?.name ? ` · ${it.service.name}` : ''}
                          {' '}× {it.quantity}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {formatCurrency((it.price ?? 0) * (it.quantity ?? 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing — stored in order.pricing.{subtotal, discount, total} */}
              <div className="admin-card p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Payment
                </p>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount</span>
                    <span>−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white border-t border-surface-border dark:border-dark-border pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={order.paymentStatus ?? 'pending'} />
                  {/* Model field is paymentMethod (not paymentMode) */}
                  <span className="text-xs text-slate-400 capitalize">
                    {order.paymentMethod ?? '—'}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="admin-card p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{order.notes}</p>
                </div>
              )}

              <p className="text-xs text-slate-400">
                Placed {formatDateTime(order.createdAt)}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
