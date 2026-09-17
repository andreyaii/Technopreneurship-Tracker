import { Users, TrendingUp } from "lucide-react";
import ProgressCard from "./ProgressCard";
import CourseDeliverables from "./CourseDeliverables";
import MentorCommentsCard from "./MentorCommentsCard";

/**
 * Own-group project body: overview + group deliverables.
 * Does not list teammate names or other groups' trackers.
 */
export default function ProjectDetails({
  project,
  memberCount,
  members,
  deliverables,
  notes,
  setNotes,
  isAdviser,
  mentorName = "Engr. Jonathan A. Cartilla",
}) {
  const { title, description, progress } = project;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-surface-border bg-white p-6 sm:p-8 shadow-card">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">{title}</h1>
        <p className="mt-2 text-sm sm:text-base text-brand-black/60 max-w-2xl">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProgressCard label="Overall Project Progress" value={progress} icon={TrendingUp} />
        <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">
              Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-yellow-soft flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-black" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-4xl font-display font-bold leading-none">
            {memberCount}
          </span>
        </div>
      </div>

      <CourseDeliverables deliverables={deliverables} title="Group Deliverables" />

      <section className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {isAdviser ? "Advisee Members" : "Project Members"}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {members.map((member) => (
            <div
              key={member.studentNo}
              className="rounded-lg bg-surface-muted px-3 py-2 text-sm"
            >
              <span className="font-medium">{member.name}</span>
              <span className="block text-xs text-brand-black/45">{member.studentNo}</span>
            </div>
          ))}
        </div>
      </section>

      <MentorCommentsCard
        notes={notes}
        setNotes={setNotes}
        groupCode={project.groupCode}
        mentorName={mentorName}
        isAdviser={isAdviser}
      />
    </div>
  );
}
