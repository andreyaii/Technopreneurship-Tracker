import { useEffect, useState, useCallback } from "react";
import {
  MessageSquareQuote,
  MessageSquare,
  Star,
  RotateCcw,
  Users2,
  User,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { getGroupComments, getIndividualComments, getRatings } from "../services/projectService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StarDisplay({ rating, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < rating ? "fill-brand-yellow text-brand-yellow" : "text-surface-border"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function RatingCard({ label, ratingObj, icon: Icon }) {
  if (!ratingObj) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-black/50">
          <Icon className="w-4 h-4" strokeWidth={2.25} />
          {label}
        </div>
        <p className="text-xs text-brand-black/40">No rating yet.</p>
      </div>
    );
  }

  const rating = Number(ratingObj.rating) || 0;

  return (
    <div className="rounded-xl border border-brand-yellow/40 bg-brand-yellow-soft/30 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-black/60">
        <Icon className="w-4 h-4" strokeWidth={2.25} />
        {label}
      </div>
      <div className="flex items-center gap-3">
        <StarDisplay rating={rating} />
        <span className="text-lg font-bold text-brand-black">{rating} / 5</span>
      </div>
      {ratingObj.adviser && (
        <p className="text-xs text-brand-black/50">
          By {ratingObj.adviser}
          {ratingObj.timestamp ? ` · ${formatTimestamp(ratingObj.timestamp)}` : ""}
        </p>
      )}
    </div>
  );
}

function CommentItem({ comment }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 flex flex-col gap-2 animate-fadeIn">
      <p className="text-sm text-brand-black/90 leading-relaxed whitespace-pre-wrap">
        {comment.comment}
      </p>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-border">
        <span className="text-xs font-semibold text-brand-black/70">
          {comment.adviser || "Adviser"}
        </span>
        {comment.timestamp && (
          <span className="text-xs text-brand-black/40">
            {formatTimestamp(comment.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center rounded-xl bg-surface-muted/40 border border-dashed border-surface-border">
      <MessageSquare className="w-8 h-8 text-brand-black/25 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-brand-black/50">{message}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-lg bg-brand-yellow-soft flex items-center justify-center border border-brand-yellow/30 shrink-0">
        <Icon className="w-4 h-4 text-brand-black" strokeWidth={2.2} />
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-brand-black/50">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * StudentCommentsSection
 *
 * Displays:
 *  1. Group Rating
 *  2. Individual Rating (own only)
 *  3. Group Comments (for the student's groupCode)
 *  4. Individual Comments (for the student's studentNo ONLY — server-scoped)
 *
 * Privacy:
 *  - Group comments: fetched by groupCode — all members see the same set.
 *  - Individual comments: fetched by studentNo — only this student's records
 *    are returned by the API; no CSS-hiding trick is used.
 */
export default function StudentCommentsSection({ groupCode, studentNo, className = "" }) {
  const [groupComments, setGroupComments] = useState([]);
  const [individualComments, setIndividualComments] = useState([]);
  const [ratings, setRatings] = useState({ groupRating: null, individualRating: null });

  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingIndividual, setLoadingIndividual] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);

  const [errorGroup, setErrorGroup] = useState("");
  const [errorIndividual, setErrorIndividual] = useState("");
  const [errorRatings, setErrorRatings] = useState("");

  const loadGroupComments = useCallback(async () => {
    if (!groupCode) return;
    setLoadingGroup(true);
    setErrorGroup("");
    try {
      const data = await getGroupComments(groupCode);
      // Newest first
      setGroupComments([...data].reverse());
    } catch (err) {
      setErrorGroup(err?.message || "Failed to load group comments.");
    } finally {
      setLoadingGroup(false);
    }
  }, [groupCode]);

  const loadIndividualComments = useCallback(async () => {
    if (!studentNo) return;
    setLoadingIndividual(true);
    setErrorIndividual("");
    try {
      const data = await getIndividualComments(studentNo);
      setIndividualComments([...data].reverse());
    } catch (err) {
      setErrorIndividual(err?.message || "Failed to load individual comments.");
    } finally {
      setLoadingIndividual(false);
    }
  }, [studentNo]);

  const loadRatings = useCallback(async () => {
    if (!groupCode || !studentNo) return;
    setLoadingRatings(true);
    setErrorRatings("");
    try {
      const data = await getRatings(groupCode, studentNo);
      setRatings(data);
    } catch (err) {
      setErrorRatings(err?.message || "Failed to load ratings.");
    } finally {
      setLoadingRatings(false);
    }
  }, [groupCode, studentNo]);

  useEffect(() => {
    loadGroupComments();
    loadIndividualComments();
    loadRatings();
  }, [loadGroupComments, loadIndividualComments, loadRatings]);

  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      {/* ── Ratings ── */}
      <div className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center border border-brand-yellow/30 shadow-xs">
              <Star className="w-4 h-4 text-brand-black" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
                Adviser Ratings
              </h2>
              <p className="text-xs text-brand-black/50">
                Ratings assigned by your adviser
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-brand-black/60 border border-surface-border">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-black/40" />
            Student View
          </span>
        </div>

        {loadingRatings ? (
          <div className="flex items-center gap-2.5 text-sm text-brand-black/60 py-3">
            <LoadingSpinner size="sm" text="Loading ratings..." />
          </div>
        ) : errorRatings ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-rose-600">{errorRatings}</p>
            <button
              type="button"
              onClick={loadRatings}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-border/50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RatingCard
              label="Group Rating"
              ratingObj={ratings.groupRating}
              icon={Users2}
            />
            <RatingCard
              label="My Individual Rating"
              ratingObj={ratings.individualRating}
              icon={User}
            />
          </div>
        )}
      </div>

      {/* ── Comments card ── */}
      <div className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center border border-brand-yellow/30 shadow-xs">
              <MessageSquareQuote className="w-4 h-4 text-brand-black" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
                Mentor Comments &amp; Guidance
              </h2>
              <p className="text-xs text-brand-black/50">
                Official feedback from your adviser
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-brand-black/60 border border-surface-border">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-black/40" />
            Student View
          </span>
        </div>

        {/* Group Comments */}
        <div className="mb-6">
          <SectionHeader
            icon={Users2}
            title="Group Comments"
            subtitle="Visible to all members of your group"
          />

          {loadingGroup ? (
            <div className="flex items-center gap-2.5 text-sm text-brand-black/60 py-3">
              <LoadingSpinner size="sm" text="Loading group comments..." />
            </div>
          ) : errorGroup ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-rose-600">{errorGroup}</p>
              <button
                type="button"
                onClick={loadGroupComments}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-border/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : groupComments.length === 0 ? (
            <EmptyState message="No group comments yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {groupComments.map((c, idx) => (
                <CommentItem key={`gc-${idx}`} comment={c} />
              ))}
            </div>
          )}
        </div>

        {/* Individual Comments */}
        <div>
          <SectionHeader
            icon={User}
            title="Individual Comments"
            subtitle="Visible only to you"
          />

          {loadingIndividual ? (
            <div className="flex items-center gap-2.5 text-sm text-brand-black/60 py-3">
              <LoadingSpinner size="sm" text="Loading individual comments..." />
            </div>
          ) : errorIndividual ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-rose-600">{errorIndividual}</p>
              <button
                type="button"
                onClick={loadIndividualComments}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-border/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : individualComments.length === 0 ? (
            <EmptyState message="No individual comments yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {individualComments.map((c, idx) => (
                <CommentItem key={`ic-${idx}`} comment={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
