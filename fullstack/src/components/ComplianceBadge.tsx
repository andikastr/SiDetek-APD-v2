import { ComplianceStatus } from "@/types";

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  size?: "sm" | "md" | "lg";
}

export default function ComplianceBadge({
  status,
  size = "md",
}: ComplianceBadgeProps) {
  const configs = {
    COMPLIANT: {
      label: "Compliant",
      dot: "bg-emerald-600",
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
    },
    PARTIAL: {
      label: "Partial",
      dot: "bg-amber-500",
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-900",
    },
    NON_COMPLIANT: {
      label: "Violation",
      dot: "bg-rose-600",
      border: "border-rose-200",
      bg: "bg-rose-50",
      text: "text-rose-900",
    },
  };

  const config = configs[status] || configs.NON_COMPLIANT;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[11px] gap-1.5",
    md: "px-3 py-1 text-xs gap-1.5 font-medium",
    lg: "px-3.5 py-1.5 text-xs gap-2 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.border} ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
