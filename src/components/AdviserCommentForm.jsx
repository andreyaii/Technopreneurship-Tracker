import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Star,
  Users2,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import {
  getGroupMembers,
  addGroupComment,
  addIndividualComment,
  addRating,
  getGroupComments,
  getIndividualComments,
} from "../services/projectService";
import { useAuth } from "../context/AuthContext";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TargetToggle({ value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-brand-black/60">
        Comment For
      </label>
      <div
        role="radiogroup"
        aria-label="Comment target"
        className="grid grid-cols-2 p-1.5 bg-surface-muted rounded-xl border border-surface-border gap-1.5"
      >
        {["Group", "Individual"].map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={value === opt}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
              value === opt
                ? "bg-brand-black text-white shadow-sm"
                : "text-brand-black/60 hover:text-brand-black hover:bg-white/70"
            }`}
          >
            {opt === "Group" ? (
              <Users2 className="w-4 h-4" strokeWidth={2.25} />
            ) : (
              <User className="w-4 h-4" strokeWidth={2.25} />
            )}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function StarRatingInput({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-brand-black/60">
        Rating (1–5)
      </label>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n === value ? 0 : n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star`}
            className="transition-transform duration-100 hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                (hovered ? n <= hovered : n <= value)
                  ? "fill-brand-yellow text-brand-yellow"
                  : "text-surface-border"
              }`}
              strokeWidth={1.5}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-1 text-sm font-bold text-brand-black">
            {value} / 5
          </span>
        )}
      </div>
    </div>
  );
}

function CommentHistoryList({ comments, loading, error, emptyMsg }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-black/40 py-2">
        <LoadingSpinner size="sm" text="Loading..." />
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }
  if (!comments.length) {
    return <p className="text-sm text-brand-black/40 py-2">{emptyMsg}</p>;
  }

  return (
    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
      {[...comments].reverse().map((c, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-surface-border bg-surface-muted/40 p-3 text-sm animate-fadeIn"
        >
          <p className="text-brand-black/90 whitespace-pre-wrap leading-relaxed mb-1.5">
            {c.comment}
          </p>
          <div className="flex items-center justify-between gap-2 text-xs text-brand-black/50">
            <span className="font-semibold">{c.adviser || "Adviser"}</span>
            <span>{c.timestamp ? new Date(c.timestamp).toLocaleString() : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * AdviserCommentForm
 *
 * Props:
 *  - groupCode: string — the currently selected group
 *  - groupLabel: string — human-readable label for the group
 *
 * Reads adviser identity from AuthContext (never manually entered).
 * Handles both group and individual comment/rating submission.
 */
export default function AdviserCommentForm({ groupCode, groupLabel }) {
  const { student: adviser } = useAuth();
  const adviserName = adviser?.name || "Adviser";

  // Members of the selected group
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Comment form state
  const [commentTarget, setCommentTarget] = useState("Group");
  const [selectedMember, setSelectedMember] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | success | error
  const [submitError, setSubmitError] = useState("");

  // Rating form (separate from comment if desired — here combined)
  const [ratingTarget, setRatingTarget] = useState("Group");
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMember, setRatingMember] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingStatus, setRatingStatus] = useState("idle");
  const [ratingError, setRatingError] = useState("");

  // Comment history
  const [groupComments, setGroupComments] = useState([]);
  const [individualComments, setIndividualComments] = useState([]);
  const [loadingGroupHistory, setLoadingGroupHistory] = useState(false);
  const [loadingIndHistory, setLoadingIndHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Load group members whenever groupCode changes
  const loadMembers = useCallback(async () => {
    if (!groupCode) return;
    setLoadingMembers(true);
    setSelectedMember(null);
    setRatingMember(null);
    try {
      const data = await getGroupMembers(groupCode);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [groupCode]);

  // Load comment history
  const loadGroupHistory = useCallback(async () => {
    if (!groupCode) return;
    setLoadingGroupHistory(true);
    try {
      const data = await getGroupComments(groupCode);
      setGroupComments(data);
    } catch (err) {
      setHistoryError(err?.message || "Failed to load comments.");
    } finally {
      setLoadingGroupHistory(false);
    }
  }, [groupCode]);

  const loadIndividualHistory = useCallback(async () => {
    if (!selectedMember?.studentNo) return;
    setLoadingIndHistory(true);
    try {
      const data = await getIndividualComments(selectedMember.studentNo);
      setIndividualComments(data);
    } catch (err) {
      setHistoryError(err?.message || "Failed to load comments.");
    } finally {
      setLoadingIndHistory(false);
    }
  }, [selectedMember]);

  useEffect(() => {
    loadMembers();
    loadGroupHistory();
  }, [loadMembers, loadGroupHistory]);

  useEffect(() => {
    if (selectedMember) loadIndividualHistory();
  }, [selectedMember, loadIndividualHistory]);

  // Reset form when target changes
  useEffect(() => {
    setCommentText("");
    setSubmitStatus("idle");
    setSubmitError("");
    setSelectedMember(null);
  }, [commentTarget]);

  // Submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      setSubmitError("Comment cannot be empty.");
      return;
    }
    if (commentTarget === "Individual" && !selectedMember) {
      setSubmitError("Please select a student.");
      return;
    }

    setSubmitting(true);
    setSubmitStatus("idle");
    setSubmitError("");

    try {
      const adviserId = adviser?.adviserNo || adviserName;
      if (commentTarget === "Group") {
        await addGroupComment(groupCode, adviserName, trimmed, adviserId);
        await loadGroupHistory();
      } else {
        await addIndividualComment(
          { studentNo: selectedMember.studentNo, name: selectedMember.name, groupCode },
          adviserName,
          trimmed,
          adviserId
        );
        await loadIndividualHistory();
      }
      setCommentText("");
      setSubmitStatus("success");
      setTimeout(() => setSubmitStatus("idle"), 4000);
    } catch (err) {
      setSubmitStatus("error");
      setSubmitError(err?.message || "Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit rating (separate action)
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      setRatingError("Please select a rating from 1 to 5.");
      return;
    }
    if (ratingTarget === "Individual" && !ratingMember) {
      setRatingError("Please select a student to rate.");
      return;
    }

    setSubmittingRating(true);
    setRatingStatus("idle");
    setRatingError("");

    try {
      const studentRecord =
        ratingTarget === "Individual"
          ? { studentNo: ratingMember.studentNo, name: ratingMember.name }
          : null;

      const adviserId = adviser?.adviserNo || adviserName;
      await addRating(ratingTarget, groupCode, studentRecord, adviserName, ratingValue, adviserId);
      setRatingValue(0);
      setRatingMember(null);
      setRatingStatus("success");
      setTimeout(() => setRatingStatus("idle"), 4000);
    } catch (err) {
      setRatingStatus("error");
      setRatingError(err?.message || "Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!groupCode) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted/30 p-8 text-center">
        <p className="text-sm text-brand-black/50">Select a group to post feedback.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Comment Form ── */}
      <section className="rounded-2xl border border-brand-yellow/50 bg-brand-yellow-soft/40 p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-brand-yellow/30">
          <div className="w-9 h-9 rounded-xl bg-brand-black text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
                Post Feedback
              </h2>
              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-black text-white">
                Adviser Mode
              </span>
            </div>
            <p className="text-xs text-brand-black/60 mt-0.5">
              Group: <strong>{groupLabel || groupCode}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitComment} className="flex flex-col gap-4">
          <TargetToggle
            value={commentTarget}
            onChange={setCommentTarget}
            disabled={submitting}
          />

          {commentTarget === "Group" ? (
            <div className="text-xs text-brand-black/50 px-1">
              Comment will be visible to <strong>all members</strong> of{" "}
              <strong>{groupLabel || groupCode}</strong>.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="member-select"
                className="text-xs font-semibold uppercase tracking-wide text-brand-black/60"
              >
                Select Student
              </label>
              <div className="relative">
                {loadingMembers ? (
                  <div className="flex items-center gap-2 text-sm text-brand-black/40 px-3 py-2.5">
                    <LoadingSpinner size="sm" text="Loading members..." />
                  </div>
                ) : (
                  <>
                    <select
                      id="member-select"
                      value={selectedMember ? selectedMember.studentNo : ""}
                      onChange={(e) => {
                        const m = members.find(
                          (x) => x.studentNo === e.target.value
                        );
                        setSelectedMember(m || null);
                      }}
                      disabled={submitting}
                      className="w-full appearance-none rounded-xl border border-brand-black/20 bg-white px-4 py-3 pr-10 text-sm text-brand-black outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Select a student --</option>
                      {members.map((m) => (
                        <option key={m.studentNo} value={m.studentNo}>
                          {m.memberNo ? `${m.memberNo} - ` : ""}
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40" />
                  </>
                )}
              </div>
              {selectedMember && (
                <p className="text-xs text-brand-black/50 px-1">
                  Comment will be visible <strong>only to {selectedMember.name}</strong>.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="comment-textarea"
              className="text-xs font-semibold uppercase tracking-wide text-brand-black/60"
            >
              Comment
            </label>
            <textarea
              id="comment-textarea"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (submitStatus !== "idle") setSubmitStatus("idle");
              }}
              disabled={submitting}
              rows={4}
              placeholder={
                commentTarget === "Group"
                  ? "Write group feedback or milestone review notes..."
                  : "Write individual feedback for this student..."
              }
              className="w-full rounded-xl border border-brand-black/20 bg-white p-3.5 text-sm text-brand-black placeholder:text-brand-black/40 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all disabled:bg-surface-muted disabled:text-brand-black/50"
            />
            <div className="flex justify-end">
              <span className="text-xs text-brand-black/40">{commentText.length} chars</span>
            </div>
          </div>

          {submitStatus === "success" && (
            <div className="flex items-center gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Comment submitted successfully!</span>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="flex items-center gap-2.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-brand-black text-white hover:bg-brand-ink transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" color="white" inline />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Comment
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── Rating Form ── */}
      <section className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center border border-brand-yellow/30 shadow-xs">
            <Star className="w-4 h-4 text-brand-black" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
              Post Rating
            </h2>
            <p className="text-xs text-brand-black/50">Rate 1–5 stars</p>
          </div>
        </div>

        <form onSubmit={handleSubmitRating} className="flex flex-col gap-4">
          {/* Rating target selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-black/60">
              Rating For
            </label>
            <div
              role="radiogroup"
              aria-label="Rating target"
              className="grid grid-cols-2 p-1.5 bg-surface-muted rounded-xl border border-surface-border gap-1.5"
            >
              {["Group", "Individual"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={ratingTarget === opt}
                  disabled={submittingRating}
                  onClick={() => {
                    setRatingTarget(opt);
                    setRatingMember(null);
                    setRatingValue(0);
                    setRatingStatus("idle");
                    setRatingError("");
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
                    ratingTarget === opt
                      ? "bg-brand-black text-white shadow-sm"
                      : "text-brand-black/60 hover:text-brand-black hover:bg-white/70"
                  }`}
                >
                  {opt === "Group" ? (
                    <Users2 className="w-4 h-4" strokeWidth={2.25} />
                  ) : (
                    <User className="w-4 h-4" strokeWidth={2.25} />
                  )}
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {ratingTarget === "Individual" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="rating-member-select"
                className="text-xs font-semibold uppercase tracking-wide text-brand-black/60"
              >
                Select Student
              </label>
              <div className="relative">
                <select
                  id="rating-member-select"
                  value={ratingMember ? ratingMember.studentNo : ""}
                  onChange={(e) => {
                    const m = members.find((x) => x.studentNo === e.target.value);
                    setRatingMember(m || null);
                  }}
                  disabled={submittingRating || loadingMembers}
                  className="w-full appearance-none rounded-xl border border-surface-border bg-surface-muted/50 px-4 py-3 pr-10 text-sm text-brand-black outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select a student --</option>
                  {members.map((m) => (
                    <option key={m.studentNo} value={m.studentNo}>
                      {m.memberNo ? `${m.memberNo} - ` : ""}
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40" />
              </div>
            </div>
          )}

          <StarRatingInput
            value={ratingValue}
            onChange={setRatingValue}
            disabled={submittingRating}
          />

          {ratingStatus === "success" && (
            <div className="flex items-center gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Rating submitted successfully!</span>
            </div>
          )}

          {ratingStatus === "error" && (
            <div className="flex items-center gap-2.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{ratingError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submittingRating || !ratingValue}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-brand-black text-white hover:bg-brand-ink transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingRating ? (
              <>
                <LoadingSpinner size="sm" color="white" inline />
                Submitting...
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                Submit Rating
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── Comment History ── */}
      <section className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black/50 mb-4 pb-3 border-b border-surface-border">
          Comment History
        </h2>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="w-4 h-4 text-brand-black/50" strokeWidth={2.25} />
            <h3 className="text-sm font-semibold text-brand-black">Group Comments</h3>
          </div>
          <CommentHistoryList
            comments={groupComments}
            loading={loadingGroupHistory}
            error={historyError}
            emptyMsg="No group comments have been posted yet."
          />
        </div>

        {commentTarget === "Individual" && selectedMember && (
          <div>
            <div className="flex items-center gap-2 mb-2 pt-4 border-t border-surface-border">
              <User className="w-4 h-4 text-brand-black/50" strokeWidth={2.25} />
              <h3 className="text-sm font-semibold text-brand-black">
                {selectedMember.name} — Individual Comments
              </h3>
            </div>
            <CommentHistoryList
              comments={individualComments}
              loading={loadingIndHistory}
              error={historyError}
              emptyMsg={`No individual comments for ${selectedMember.name} yet.`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
