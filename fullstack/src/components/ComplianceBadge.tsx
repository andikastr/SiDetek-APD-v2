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
      dot: "bg-emerald-500",
      border: "border-emerald-200/80",
      bg: "bg-emerald-50/80",
      text: "text-emerald-800",
      iconColor: "text-emerald-600",
    },
    PARTIAL: {
      label: "Partial Warning",
      icon: AlertTriangle,
      dot: "bg-amber-500",
      border: "border-amber-200/80",
      bg: "bg-amber-50/80",
      text: "text-amber-900",
      iconColor: "text-amber-600",
    },
    NON_COMPLIANT: {
      label: "Safety Violation",
      icon: XCircle,
      dot: "bg-rose-500",
      border: "border-rose-200/80",
      bg: "bg-rose-50/80",
      text: "text-rose-900",
      iconColor: "text-rose-600",
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
      className={`inline-flex items-center rounded-lg border shadow-2xs transition-all ${config.border} ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      {showIcon ? (
        <Icon className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      )}
      <span>{config.label}</span>
    </span>
  );
}
