import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
}) => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-purple-100/90 dark:border-purple-900/40 bg-white/90 dark:bg-[#120a26]/85 shadow-[0_0_20px_rgba(168,85,247,0.12)] hover:shadow-[0_0_28px_rgba(168,85,247,0.25)] dark:shadow-[0_0_24px_rgba(168,85,247,0.2)] dark:hover:shadow-[0_0_35px_rgba(168,85,247,0.38)] hover:border-purple-300 dark:hover:border-purple-700 transition-all relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-purple-300/60 uppercase tracking-wider mb-1">
            {title}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">{value}</div>
          {subtitle && <div className="text-xs text-slate-500 dark:text-purple-300/60 mt-1">{subtitle}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:scale-110 group-hover:text-white group-hover:bg-purple-600 dark:group-hover:bg-purple-600 transition-all duration-300 shadow-sm shadow-purple-500/20">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-purple-100/80 dark:border-purple-900/30 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-purple-400/60'
            }`}
          >
            {trend}
          </span>
          <span className="text-slate-400 dark:text-purple-300/50">vs last month</span>
        </div>
      )}
    </div>
  );
};
