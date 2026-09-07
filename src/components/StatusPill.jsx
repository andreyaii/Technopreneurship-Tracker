import { CheckCircle2, Circle } from "lucide-react";

/**
 * StatusPill — deliverables are only Submitted or Missing.
 * Icon + text so meaning does not rely on color alone.
 */
const CONFIG = {
  Submitted: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  },
  Missing: {
    icon: Circle,
    classes: "bg-white text-brand-black/60 border border-surface-border",
  },
};

export default function StatusPill({ status, size = "md" }) {
  const config = CONFIG[status] || CONFIG.Missing;
  const Icon = config.icon;
  const sizeClasses =
    size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.5} />
      {status}
    </span>
  );
}
