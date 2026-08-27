import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs transition-all hover:border-gray-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center justify-center text-[#0a1b5c]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
