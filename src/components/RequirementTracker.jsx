import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import RequirementItem from "./RequirementItem";

export const DELIVERABLES_PER_PAGE = 6;

/**
 * RequirementTracker
 * Shows at most 6 deliverables at a time, with pagination when there are more.
 */
export default function RequirementTracker({ requirements = [], title = "Requirement Tracker" }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(requirements.length / DELIVERABLES_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);

  const visible = useMemo(() => {
    const start = currentPage * DELIVERABLES_PER_PAGE;
    return requirements.slice(start, start + DELIVERABLES_PER_PAGE);
  }, [requirements, currentPage]);

  if (!requirements.length) {
    return (
      <div className="rounded-2xl border border-surface-border bg-white p-6 text-sm text-brand-black/50">
        No requirement data available yet.
      </div>
    );
  }

  const startIndex = currentPage * DELIVERABLES_PER_PAGE;

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-brand-yellow-soft flex items-center justify-center">
          <ListChecks className="w-4 h-4 text-brand-black" strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      <ol>
        {visible.map((req, i) => (
          <RequirementItem
            key={req.key || req.requirement || req.id || startIndex + i}
            requirement={req}
            step={startIndex + i + 1}
            isLast={i === visible.length - 1}
          />
        ))}
      </ol>

      {requirements.length > DELIVERABLES_PER_PAGE && (
        <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between gap-3">
          <p className="text-xs text-brand-black/50">
            Showing {startIndex + 1}–{startIndex + visible.length} of {requirements.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-surface-border disabled:opacity-40 hover:bg-surface-muted"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="px-2 text-xs font-medium text-brand-black/60">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-surface-border disabled:opacity-40 hover:bg-surface-muted"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
