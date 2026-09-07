import ProgressBar from "./ProgressBar";

/**
 * ProgressCard
 * Compact summary card — a big percentage figure with a label and bar.
 * Used for "Overall Progress" style stats on the dashboard and details page.
 */
export default function ProgressCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-brand-yellow-soft flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-black" strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-4xl font-display font-bold leading-none">{value}%</span>
      </div>

      <ProgressBar value={value} size="md" showLabel />

      {hint && <p className="text-xs text-brand-black/50">{hint}</p>}
    </div>
  );
}
