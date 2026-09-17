import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Presentation,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const DELIVERABLES_PER_PAGE = 6;

function getDeliverableIcon(type) {
  switch (type) {
    case "quiz":
      return HelpCircle;
    case "pitch":
      return Sparkles;
    case "presentation":
      return Presentation;
    case "report":
      return Layers;
    case "document":
    default:
      return FileText;
  }
}

function isSubmitted(item) {
  return item.status === "Submitted" || item.isSubmitted === true;
}

function StatusBadge({ submitted }) {
  if (submitted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
        Submitted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <Circle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
      Missing
    </span>
  );
}

/**
 * Group-scoped deliverable list. Status is only Submitted or Missing.
 * Shows 6 rows per page.
 */
export default function CourseDeliverables({
  deliverables = [],
  title = "Group Deliverables",
  className = "",
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(0);

  const submittedCount = deliverables.filter(isSubmitted).length;
  const missingCount = deliverables.length - submittedCount;

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((item) => {
      const submitted = isSubmitted(item);
      if (activeFilter === "submitted") return submitted;
      if (activeFilter === "missing") return !submitted;
      return true;
    });
  }, [deliverables, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDeliverables.length / DELIVERABLES_PER_PAGE));

  useEffect(() => {
    setPage(0);
  }, [activeFilter, deliverables]);

  const currentPage = Math.min(page, totalPages - 1);
  const startIndex = currentPage * DELIVERABLES_PER_PAGE;
  const pageRows = filteredDeliverables.slice(startIndex, startIndex + DELIVERABLES_PER_PAGE);
  const submittedShare = deliverables.length
    ? Math.round((submittedCount / deliverables.length) * 100)
    : 0;

  return (
    <div
      className={`rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden flex flex-col ${className}`}
    >
      <div className="p-5 sm:p-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow-soft flex items-center justify-center shrink-0 border border-brand-yellow/30 shadow-sm">
            <BookOpen className="w-5 h-5 text-brand-black" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-display font-bold text-brand-black">
                {title}
              </h3>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-brand-black/60 border border-surface-border">
                {deliverables.length} Total
              </span>
            </div>
            <p className="text-xs text-brand-black/50 mt-0.5">
              Your group&apos;s submissions and missing items
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === "all"
              ? "bg-brand-black text-white shadow-sm"
              : "bg-surface-muted text-brand-black/60 hover:text-brand-black hover:bg-surface-border/50"
              }`}
          >
            All ({deliverables.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("submitted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === "submitted"
              ? "bg-emerald-800 text-white shadow-sm"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60"
              }`}
          >
            Submitted ({submittedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("missing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === "missing"
                ? "bg-rose-700 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200/60"
              }`}
          >
            Missing ({missingCount})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead className="bg-surface-muted/95 border-b border-surface-border text-[11px] font-bold uppercase tracking-wider text-brand-black/50">
            <tr>
              <th scope="col" className="py-3 px-5 sm:px-6">
                Deliverable
              </th>
              <th scope="col" className="py-3 px-4 w-36">
                Status
              </th>
              <th scope="col" className="py-3 px-5 sm:px-6 w-48">
                Submitted date
              </th>
              <th scope="col" className="py-3 px-4 w-28">Days late</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-surface-border text-sm">
            {pageRows.length > 0 ? (
              pageRows.map((item) => {
                const IconComponent = getDeliverableIcon(item.type);
                const submitted = isSubmitted(item);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-muted/60 transition-colors group"
                  >
                    <td className="py-4 px-5 sm:px-6">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-surface-muted border border-surface-border flex items-center justify-center shrink-0 mt-0.5 group-hover:border-brand-black/20 group-hover:bg-white transition-all">
                          <IconComponent
                            className="w-4 h-4 text-brand-black/70 group-hover:text-brand-black transition-colors"
                            strokeWidth={2.2}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-black text-sm sm:text-base leading-snug">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-brand-black/55 font-medium">
                              <Calendar className="w-3 h-3 text-brand-black/40" />
                              Due {item.dueDate}
                            </span>
                            {item.category && (
                              <>
                                <span className="text-brand-black/25">•</span>
                                <span className="text-[11px] font-medium text-brand-black/50 bg-surface-muted px-1.5 py-0.5 rounded border border-surface-border">
                                  {item.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-middle">
                      <StatusBadge submitted={submitted} />
                    </td>

                    <td className="py-4 px-5 sm:px-6 align-middle">
                      {submitted ? (
                        <span className="text-xs sm:text-sm font-medium text-brand-black">
                          {item.submittedDate}
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm text-brand-black/40">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-middle text-xs font-semibold">
                      {item.daysLate > 0 ? <span className="text-rose-700">{item.daysLate}</span> : <span className="text-emerald-700">0</span>}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-12 text-center text-sm text-brand-black/40"
                >
                  No deliverables match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 sm:px-6 py-3.5 bg-surface-muted/40 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-black/60">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-black">
              {submittedCount} of {deliverables.length}
            </span>
            <span>submitted</span>
            <span className="font-semibold text-brand-progress">{submittedShare}%</span>
          </div>
          <div className="w-full sm:w-40 bg-surface-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-progress h-full rounded-full transition-all duration-500"
              style={{ width: `${submittedShare}%` }}
            />
          </div>
        </div>

        {filteredDeliverables.length > DELIVERABLES_PER_PAGE && (
          <div className="flex items-center gap-2">
            <span>
              {filteredDeliverables.length === 0
                ? "0"
                : `${startIndex + 1}–${startIndex + pageRows.length}`}{" "}
              of {filteredDeliverables.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-border bg-white disabled:opacity-40 hover:bg-surface-muted"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-brand-black min-w-[3rem] text-center">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-border bg-white disabled:opacity-40 hover:bg-surface-muted"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
