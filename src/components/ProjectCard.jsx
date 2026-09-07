import { Users } from "lucide-react";
import ProgressBar from "./ProgressBar";

/**
 * All Projects overview card.
 * Only title, description, member count, and overall progress.
 * Not a gateway into another team's tracker or member list.
 */
export default function ProjectCard({ project }) {
  const { title, description, memberCount, progress } = project;

  return (
    <article className="w-full rounded-2xl border border-surface-border bg-white p-5 shadow-card flex flex-col gap-4">
      <div className="min-w-0">
        <h3 className="text-lg font-display font-semibold text-brand-black">
          {title}
        </h3>
        <p className="mt-1 text-sm text-brand-black/60 line-clamp-3">
          {description}
        </p>
      </div>

      <p className="inline-flex items-center gap-1.5 text-xs text-brand-black/60">
        <Users className="w-3.5 h-3.5" />
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </p>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-brand-black/50">Overall progress</span>
          <span className="text-xs font-semibold text-brand-black">{progress}%</span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>
    </article>
  );
}
