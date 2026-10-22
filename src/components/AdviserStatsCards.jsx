import { Users, FolderKanban, ListChecks, TrendingUp } from "lucide-react";

/**
 * AdviserStatsCards
 *
 * Renders the 4 summary statistics cards at the top of the Adviser Dashboard:
 *  1. Total Students: Student rows in TEC_CSIT (excluding the submission deadline row)
 *  2. Total Project Groups: Group rows in the Groups sheet
 *  3. Total Activities: Distinct deliverables/activities monitored
 *  4. Overall Completion Rate: (Completed required entries / Total required entries) * 100
 */
export default function AdviserStatsCards({ stats, loading = false, error = null }) {
  const cards = [
    {
      id: "total-students",
      title: "Total Students",
      value: loading ? "—" : stats?.totalStudents ?? 0,
      icon: Users,
      accent: "yellow",
    },
    {
      id: "total-groups",
      title: "Total Project Groups",
      value: loading ? "—" : stats?.totalGroups ?? 0,
      icon: FolderKanban,
      accent: "neutral",
    },
    {
      id: "total-activities",
      title: "Total Activities",
      value: loading ? "—" : stats?.totalActivities ?? 0,
      icon: ListChecks,
      accent: "neutral",
    },
    {
      id: "completion-rate",
      title: "Overall Completion Rate",
      value: loading
        ? "—"
        : `${(stats?.overallCompletionRate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      accent: "yellow",
      hasProgress: true,
      rate: stats?.overallCompletionRate ?? 0,
    },
  ];

  return (
    <div className="w-full">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className="relative flex flex-col justify-between rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-black/50">
                    {card.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      card.accent === "yellow"
                        ? "bg-brand-yellow-soft border-brand-yellow/30 text-brand-black"
                        : "bg-surface-muted border-surface-border text-brand-black/70"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.25} />
                  </div>
                </div>

                {loading ? (
                  <div className="h-9 w-20 bg-surface-muted animate-pulse rounded-lg mb-2" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-display font-bold text-brand-black tracking-tight">
                    {card.value}
                  </p>
                )}
              </div>

              {card.hasProgress && !loading && (
                <div className="mt-4 pt-3 border-t border-surface-border/70">
                  <div className="w-full bg-surface-border/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-yellow h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, card.rate))}%`,
                      }}
                      role="progressbar"
                      aria-valuenow={card.rate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
