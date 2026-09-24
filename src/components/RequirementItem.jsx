import { CheckCircle2, Circle } from "lucide-react";
import StatusPill from "./StatusPill";

const NODE_ICON = {
  Submitted: CheckCircle2,
  Missing: Circle,
};

const NODE_STYLE = {
  Submitted: "bg-brand-progress border-2 border-brand-progress text-white",
  Missing: "bg-white border-2 border-surface-border text-brand-black/40",
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === "string" && dateStr.trim().toLowerCase() === "open") return "Open";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * One row of the requirement/deliverable tracker.
 * Status is only Submitted or Missing — no grades or scores.
 */
export default function RequirementItem({ requirement, step, isLast }) {
  const { label, status, dueDate, submittedDate } = requirement;
  const Icon = NODE_ICON[status] || Circle;
  const isSubmitted = status === "Submitted";

  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-surface-border"
        />
      )}

      <div className="relative z-10 flex flex-col items-center shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${NODE_STYLE[status] || NODE_STYLE.Missing}`}
        >
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-brand-black/40 uppercase">
              Step {step}
            </p>
            <h4 className="text-sm font-semibold text-brand-black leading-snug">
              {label}
            </h4>
          </div>
          <StatusPill status={isSubmitted ? "Submitted" : "Missing"} size="sm" />
        </div>

        <div className="mt-2 flex flex-col gap-0.5 text-xs text-brand-black/50">
          {isSubmitted && submittedDate && (
            <p>Submitted {formatDate(submittedDate)}</p>
          )}
          {dueDate && (
            <p>{formatDate(dueDate) === "Open" ? "Open" : `Due ${formatDate(dueDate)}`}</p>
          )}
        </div>
      </div>
    </li>
  );
}
