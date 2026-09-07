/**
 * ProgressBar
 * Teal fill (distinct from the yellow brand) with a clear percentage.
 */
export default function ProgressBar({ value = 0, size = "md", showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, value));
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

  return (
    <div className="w-full">
      <div
        className={`w-full rounded-full bg-surface-border overflow-hidden ${heights[size] || heights.md}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped} percent submitted`}
      >
        <div
          className="h-full rounded-full bg-brand-progress transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs font-medium text-brand-black/60">
          {clamped}% submitted
        </div>
      )}
    </div>
  );
}
