import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "emerald" | "amber" | "rose" | "orange" | "cyan";
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] p-5 sm:p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700 group relative shadow-sm dark:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
