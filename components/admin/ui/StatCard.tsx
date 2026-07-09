import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'cyan' | 'green' | 'purple' | 'orange';
  trend?: { value: number; label: string };
  onClick?: () => void;
}

const colorMap = {
  cyan:   { icon: 'text-cyan-500 bg-cyan-500/10',   ring: 'ring-cyan-500/20' },
  green:  { icon: 'text-green-500 bg-green-500/10', ring: 'ring-green-500/20' },
  purple: { icon: 'text-purple-500 bg-purple-500/10', ring: 'ring-purple-500/20' },
  orange: { icon: 'text-orange-500 bg-orange-500/10', ring: 'ring-orange-500/20' },
};

export function StatCard({ title, value, icon: Icon, color = 'cyan', trend, onClick }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div
      className={cn(
        'admin-card p-5 page-enter',
        onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="stat-number">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs font-medium mt-1.5',
              trend.value >= 0 ? 'text-green-500' : 'text-red-400'
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-1', colors.icon, colors.ring)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
