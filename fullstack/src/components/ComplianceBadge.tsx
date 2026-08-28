import { ComplianceStatus } from "@/types";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export default function ComplianceBadge({
  status,
  size = "md",
  showIcon = true,
}: ComplianceBadgeProps) {
  const configs = {
    COMPLIANT: {
      label: "Compliant",
      icon: CheckCircle2,
      dot: "bg-slate-400 dark:bg-slate-300",
      border: "border-slate-300 dark:border-slate-700",
      bg: "bg-slate-100 dark:bg-slate-800/70",
      text: "text-slate-800 dark:text-slate-200",
      iconColor: "text-slate-700 dark:text-slate-300",
    },
    PARTIAL: {
      label: "Partial Warning",
      icon: AlertTriangle,
      dot: "bg-slate-400",
      border: "border-slate-200 dark:border-slate-700/80",
      bg: "bg-slate-100/80 dark:bg-slate-800/50",
      text: "text-slate-700 dark:text-slate-300",
      iconColor: "text-slate-500 dark:text-slate-400",
    },
    NON_COMPLIANT: {
      label: "Safety Violation",
      icon: XCircle,
      dot: "bg-slate-400 dark:bg-slate-500",
      border: "border-slate-200 dark:border-slate-700/80",
      bg: "bg-slate-100/80 dark:bg-slate-800/50",
      text: "text-slate-600 dark:text-slate-400",
      iconColor: "text-slate-500 dark:text-slate-400",
    },
  };

  const config = configs[status] || configs.NON_COMPLIANT;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1 font-semibold",
    md: "px-2.5 py-1 text-xs gap-1.5 font-semibold",
    lg: "px-3.5 py-1.5 text-xs gap-2 font-bold",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.border} ${config.bg} ${config.text} ${sizeClasses[size]} tracking-tight transition-all font-mono`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
}
