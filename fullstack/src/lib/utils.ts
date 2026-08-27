import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ComplianceStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function getStatusTheme(status: ComplianceStatus) {
  switch (status) {
    case "COMPLIANT":
      return {
        label: "Compliant",
        badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        border: "border-emerald-500",
        dot: "bg-emerald-500",
        text: "text-emerald-700",
        bg: "bg-emerald-50",
      };
    case "PARTIAL":
      return {
        label: "Partial",
        badgeBg: "bg-amber-50 text-amber-900 border-amber-200",
        border: "border-amber-500",
        dot: "bg-amber-500",
        text: "text-amber-700",
        bg: "bg-amber-50",
      };
    case "NON_COMPLIANT":
    default:
      return {
        label: "Violation",
        badgeBg: "bg-rose-50 text-rose-900 border-rose-200",
        border: "border-rose-500",
        dot: "bg-rose-500",
        text: "text-rose-700",
        bg: "bg-rose-50",
      };
  }
}
