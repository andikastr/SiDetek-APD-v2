import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "emerald" | "amber" | "rose";
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const iconVariants = {
    default: "bg-slate-100 text-slate-700 border-slate-200/80",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    amber: "bg-amber-50 text-amber-600 border-amber-200/60",
    rose: "bg-rose-50 text-rose-600 border-rose-200/60",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs transition-transform hover:scale-105 ${iconVariants[variant]}`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-technical">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
