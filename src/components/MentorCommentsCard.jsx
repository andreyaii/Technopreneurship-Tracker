import { useState } from "react";
import {
  MessageSquareQuote,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { saveAdviserFeedback } from "../services/projectService";

export default function MentorCommentsCard({
  notes = { studentComment: "", adviserFeedback: "" },
  setNotes,
  groupCode,
  mentorName = "Engr. Jonathan A. Cartilla",
  isAdviser = false,
  className = "",
}) {
  const currentSavedFeedback = notes?.adviserFeedback || "";
  const [feedback, setFeedback] = useState(currentSavedFeedback);
  const [prevSavedFeedback, setPrevSavedFeedback] = useState(currentSavedFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // "idle" | "submitting" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state if notes change externally (React pattern for adjusting state when props change)
  if (prevSavedFeedback !== currentSavedFeedback) {
    setPrevSavedFeedback(currentSavedFeedback);
    setFeedback(currentSavedFeedback);
  }

  // Clean initials for mentor avatar
  const mentorInitials = mentorName
    .replace(/^(Engr\.|Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("") || "MN";

  const hasUnsavedChanges = feedback.trim() !== currentSavedFeedback.trim();

  const handleSaveFeedback = async () => {
    if (!groupCode) return;
    setIsSubmitting(true);
    setSubmitStatus("submitting");
    setErrorMessage("");

    try {
      const updatedNotes = await saveAdviserFeedback(groupCode, feedback);
      if (setNotes) {
        setNotes(updatedNotes);
      }
      setSubmitStatus("success");

      // Reset success status after 4 seconds
      setTimeout(() => {
        setSubmitStatus((prev) => (prev === "success" ? "idle" : prev));
      }, 4000);
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err?.message || "Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setFeedback(currentSavedFeedback);
    setSubmitStatus("idle");
    setErrorMessage("");
  };

  // ---------------------------------------------------------------------------
  // 1. ADVISER / MENTOR VIEW: Can submit comments with full indicator states
  // ---------------------------------------------------------------------------
  if (isAdviser) {
    return (
      <section
        className={`rounded-2xl border border-brand-yellow/50 bg-brand-yellow-soft/50 p-5 sm:p-6 shadow-card transition-all ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-yellow/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-black text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
                  Mentor Comments & Guidance
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-black text-white">
                  Adviser Mode
                </span>
              </div>
              <p className="text-xs text-brand-black/60 mt-0.5">
                Post milestone feedback and progress comments. Students can view this on their dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Unsaved changes
              </span>
            )}
            <span className="text-xs text-brand-black/50 font-medium px-2 py-1 rounded-md bg-white/60 border border-brand-yellow/30">
              {feedback.length} chars
            </span>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              if (submitStatus !== "idle") setSubmitStatus("idle");
            }}
            disabled={isSubmitting}
            rows={4}
            className="w-full rounded-xl border border-brand-black/20 bg-white p-3.5 text-sm text-brand-black placeholder:text-brand-black/40 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all disabled:bg-surface-muted disabled:text-brand-black/50"
            placeholder="Add guidance, milestone review notes, or progress advice for this team..."
          />
        </div>

        {/* Dynamic submission indicators */}
        {submitStatus === "success" && (
          <div className="mt-3 flex items-center gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Comment submitted successfully! The team can now view this on their dashboard.
            </span>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="mt-3 flex items-center gap-2.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveFeedback}
              disabled={isSubmitting || !hasUnsavedChanges || (!feedback.trim() && !currentSavedFeedback)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm ${
                submitStatus === "success"
                  ? "bg-emerald-700 text-white"
                  : "bg-brand-black text-white hover:bg-brand-ink disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting comment...</span>
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Comment Saved</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Comment</span>
                </>
              )}
            </button>

            {hasUnsavedChanges && !isSubmitting && (
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-black/60 hover:text-brand-black px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </button>
            )}
          </div>

          <p className="text-xs text-brand-black/50">
            {currentSavedFeedback
              ? "● 1 active comment published to students"
              : "○ No comments published yet"}
          </p>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. STUDENT VIEW: Read-only Mentor Comments (cannot leave progress comments)
  // ---------------------------------------------------------------------------
  return (
    <section
      className={`rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center text-brand-black border border-brand-yellow/30 shadow-xs">
            <MessageSquareQuote className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
              Mentor Comments & Guidance
            </h2>
            <p className="text-xs text-brand-black/50">
              Official progress comments left by your mentor
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-brand-black/60 border border-surface-border">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-black/40"></span>
          Student View
        </span>
      </div>

      {currentSavedFeedback ? (
        <div className="rounded-xl border border-brand-yellow/30 bg-gradient-to-br from-brand-yellow-soft/40 to-surface-muted/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-black text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {mentorInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-brand-black leading-snug">{mentorName}</p>
                <p className="text-[11px] text-brand-black/55 font-medium">Project Mentor & Adviser</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-brand-yellow/40 text-brand-black shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Mentor Feedback
            </span>
          </div>
          <div className="rounded-lg bg-white/80 p-3.5 border border-brand-yellow/20">
            <p className="text-sm text-brand-black/90 leading-relaxed whitespace-pre-wrap font-sans">
              {currentSavedFeedback}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl bg-surface-muted/40 border border-dashed border-surface-border">
          <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center mb-2.5 text-brand-black/40">
            <MessageSquare className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-brand-black/75">No mentor comments yet</p>
          <p className="text-xs text-brand-black/50 max-w-sm mt-1">
            Your mentor has not posted any progress guidance yet. Comments and feedback will appear here as your project milestones are reviewed.
          </p>
        </div>
      )}
    </section>
  );
}
