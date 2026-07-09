import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  accepted:         'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  pickup:           'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  picked_up:        'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  processing:       'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  ready:            'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  out_for_delivery: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  failed_delivery:  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  delivered:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  completed:        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled:        'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  rejected:         'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  // Owner/Tenant statuses
  active:           'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  inactive:         'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  monthly:          'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  yearly:           'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  onetime:          'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  paid:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  cash:             'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  upi:              'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

const LABELS: Record<string, string> = {
  picked_up:        'Picked Up',
  out_for_delivery: 'Out for Delivery',
  failed_delivery:  'Failed Delivery',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  const label = LABELS[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={cn('status-badge', style, className)}>
      {label}
    </span>
  );
}
