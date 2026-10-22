import { useEffect, useState } from "react";
import { Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressBar from "./ProgressBar";
import { useAuth } from "../context/AuthContext";
import { getProjectMemberCount } from "../services/projectService";

/**
 * All Projects overview card.
 * Only title, description, member count, and overall progress.
 * In student view, cards are informational and non-interactive (no hover effect).
 * Advisers can access the full details of advisee projects.
 */
export default function ProjectCard({ project }) {
  const { student } = useAuth();
  const isAdviser = student?.role === "adviser";
  const groupCode =
    typeof project?.groupCode === "string" ? project.groupCode.trim() : "";
  const [fetchedMemberCount, setFetchedMemberCount] = useState(null);
  const [memberCountError, setMemberCountError] = useState(false);
  const hasMemberCount = Number(project?.memberCount) > 0;
  const memberCount = hasMemberCount
    ? Number(project.memberCount)
    : fetchedMemberCount;
  const progress = project?.progress ?? 0;

  useEffect(() => {
    if (!groupCode || hasMemberCount) return undefined;

    let isCurrent = true;
    getProjectMemberCount(groupCode)
      .then((count) => {
        if (isCurrent) setFetchedMemberCount(count);
      })
      .catch(() => {
        if (isCurrent) setMemberCountError(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [groupCode, hasMemberCount]);

  if (!groupCode) return null;

  const title =
    typeof project.title === "string" && project.title.trim()
      ? project.title.trim()
      : "None";
  const description =
    typeof project.description === "string" && project.description.trim()
      ? project.description.trim()
      : `${groupCode}`;

  const cardContent = (
    <>
      <div className="min-w-0">
        <h3 className="flex items-center justify-between gap-2 text-lg font-display font-semibold text-brand-black">
          <span>{title}</span>
          {isAdviser && (
            <ArrowUpRight className="w-4 h-4 shrink-0 text-brand-black/40" />
          )}
        </h3>
        {isAdviser && (
          <p className="mt-1 text-xs font-medium text-brand-black/50">
            Group Code: <span className="text-brand-black">{groupCode}</span>
          </p>
        )}
        <p className="mt-1 text-sm text-brand-black/60 line-clamp-3">
          {description}
        </p>
      </div>

      <p className="inline-flex items-center gap-1.5 text-xs text-brand-black/60">
        <Users className="w-3.5 h-3.5" />
        {memberCountError
          ? "Member count unavailable"
          : memberCount === null
          ? "Loading members..."
          : `${memberCount} ${memberCount === 1 ? "member" : "members"}`}
      </p>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-brand-black/50">Overall progress</span>
          <span className="text-xs font-semibold text-brand-black">{progress}%</span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>
    </>
  );

  if (isAdviser) {
    return (
      <Link
        to={`/projects/${project.groupCode}`}
        className="w-full rounded-2xl border border-surface-border bg-white p-5 shadow-card flex flex-col gap-4 hover:border-brand-black/30 hover:-translate-y-0.5 transition-all cursor-pointer"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-surface-border bg-white p-5 shadow-card flex flex-col gap-4">
      {cardContent}
    </div>
  );
}
