import {
  BarChart3,
  HelpCircle,
  FileText,
  Sparkles,
  Layers,
  Info,
  AlertCircle,
} from "lucide-react";

function getActivityIcon(type) {
  switch (type) {
    case "quiz":
      return HelpCircle;
    case "pitch":
      return Sparkles;
    case "report":
      return Layers;
    case "document":
    default:
      return FileText;
  }
}

/**
 * ActivityCompletionChart
 *
 * Renders a horizontal bar chart of monitored activities,
 * sorted from lowest completion rate to highest.
 */
export default function ActivityCompletionChart({
  activities = [],
  loading = false,
  error = null,
}) {
  return (
    <section className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow-soft flex items-center justify-center shrink-0 border border-brand-yellow/30 shadow-sm">
            <BarChart3 className="w-5 h-5 text-brand-black" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-display font-bold text-brand-black">
                Activity Completion Overview
              </h2>
              {!loading && activities.length > 0 && (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-brand-black/60 border border-surface-border">
                  {activities.length} Deliverables
                </span>
              )}
            </div>
            <p className="text-xs text-brand-black/50 mt-0.5">
              Sorted from lowest to highest completion to highlight activities needing attention
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-brand-black/60 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-brand-yellow border border-brand-yellow/40 inline-block" />
            <span className="font-medium">Completion Rate (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-surface-border inline-block" />
            <span className="font-medium">Remaining</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Unable to load activity completion data</p>
            <p className="text-xs mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="py-8 flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-surface-muted rounded" />
                <div className="h-4 w-20 bg-surface-muted rounded" />
              </div>
              <div className="h-3 w-full bg-surface-muted rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && activities.length === 0 && (
        <div className="py-12 text-center text-sm text-brand-black/45 flex flex-col items-center justify-center gap-2">
          <Info className="w-6 h-6 text-brand-black/30" />
          <p className="font-semibold text-brand-black/60">No activity data found</p>
          <p className="text-xs max-w-sm text-brand-black/45">
            No monitored course deliverables were returned from the spreadsheet data. Ensure project groups are registered.
          </p>
        </div>
      )}

      {/* Horizontal Bar Chart */}
      {!loading && !error && activities.length > 0 && (
        <div className="mt-5 flex flex-col divide-y divide-surface-border/50">
          {activities.map((act) => {
            const Icon = getActivityIcon(act.type);
            const rate = Number(act.completionRate) || 0;

            // Visual accent: if completion rate is very low (<50%), give distinct emphasis
            const isLow = rate < 50;

            return (
              <div
                key={act.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col gap-2 rounded-xl px-2"
              >
                {/* Top Row: Activity Name, Badges, and Stats */}
                <div className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left: Icon, Title, Type */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        isLow
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-surface-muted border-surface-border text-brand-black/70"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-semibold text-sm text-brand-black truncate">
                        {act.title}
                      </span>

                      {act.type && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted border border-surface-border text-brand-black/50 shrink-0">
                          {act.type}
                        </span>
                      )}

                      {isLow && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          Needs Attention
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Percentage & Counts */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-right">
                    <div className="flex flex-col sm:items-end">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display font-bold text-sm sm:text-base text-brand-black">
                          {rate.toFixed(1)}%
                        </span>
                        <span className="text-xs text-brand-black/45">
                          ({act.completedCount} / {act.totalRequired} students)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Bar */}
                <div
                  className="w-full h-3.5 bg-surface-border/50 rounded-full overflow-hidden p-0.5 border border-surface-border/80"
                  role="progressbar"
                  aria-label={`${act.title} completion rate`}
                  aria-valuenow={rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isLow ? "bg-amber-400" : "bg-brand-yellow"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, rate))}%`,
                    }}
                  />
                </div>

              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
