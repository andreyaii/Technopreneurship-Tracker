import { useEffect, useState } from "react";
import {
  IdCard,
  Users2,
  Hash,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import {
  getProjectByGroupCode,
  getGroupMembers,
  getGroupDeliverables,
  getGroupSubmissionProgress,
} from "../services/projectService";
import ProgressCard from "../components/ProgressCard";
import CourseDeliverables from "../components/CourseDeliverables";
import StudentCommentsSection from "../components/StudentCommentsSection";

function InfoTile({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-start gap-3 min-w-0 ${className}`}>
      <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-brand-black/60" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-brand-black/45">{label}</p>
        <p className="text-sm font-semibold text-brand-black leading-snug break-words" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Scoped to the logged-in student's group only. Other teams' deliverables
  // are never fetched here. Keep using student.groupCode from AuthContext —
  // never a URL parameter.
  const { student } = useAuth();

  const [project, setProject] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [deliverables, setDeliverables] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!student?.groupCode) return;

    let isCurrent = true;

    async function loadDashboardData() {
      setIsLoading(true);
      const [projectData, members, groupDeliverables, progress] = await Promise.all([
        getProjectByGroupCode(student.groupCode),
        getGroupMembers(student.groupCode),
        getGroupDeliverables(student.groupCode),
        getGroupSubmissionProgress(student.groupCode),
      ]);

      const userDeliverables =
        student?.deliverables && student.deliverables.length > 0
          ? student.deliverables
          : groupDeliverables;

      const userProgress =
        typeof student?.progress === "number" && student.progress > 0
          ? student.progress
          : progress;

      if (!isCurrent) return;
      setProject(projectData);
      setGroupMembers(members);
      setShowGroupMembers(false);
      setDeliverables(userDeliverables);
      setOverallProgress(userProgress);
      setIsLoading(false);
    }

    loadDashboardData();
    return () => {
      isCurrent = false;
    };
  }, [student]);

  if (!student) return null;

  const firstName = student.name.split(",")[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-sm text-brand-black/55">
          This dashboard shows only your group&apos;s deliverables and progress.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-brand-black/60">
          <LoadingSpinner size="md" text="Loading your dashboard..." />
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-surface-border bg-white p-6 sm:p-7 shadow-card">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-black/45 mb-5">
              Student Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
              <InfoTile icon={IdCard} label="Full Name" value={student.name} />
              <InfoTile icon={Hash} label="Student Number" value={student.studentNo} />
              <InfoTile icon={BookOpen} label="Section" value={student.section} />
              <InfoTile icon={GraduationCap} label="Mentor" value={student.mentor || "—"} />
              <InfoTile icon={Users2} label="Your Group" value={student.groupCode} />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-2xl border border-surface-border bg-white p-6 shadow-card flex flex-col">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black/45 mb-4">
                My Group&apos;s Project
              </h2>

              {project ? (
                <>
                  <h3 className="text-xl font-display font-bold">{project.title}</h3>
                  <p className="mt-2 text-sm text-brand-black/60 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-brand-black/60">
                    <button
                      type="button"
                      aria-expanded={showGroupMembers}
                      aria-controls="student-group-members"
                      onClick={() => setShowGroupMembers((visible) => !visible)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 transition-colors hover:bg-brand-yellow-soft focus-visible:outline-brand-black"
                    >
                      <Users2 className="w-3 h-3" />
                      {groupMembers.length}{" "}
                      {groupMembers.length === 1 ? "member" : "members"}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          showGroupMembers ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {showGroupMembers && (
                    <div
                      id="student-group-members"
                      className="mt-4 rounded-xl border border-surface-border bg-surface-muted/50 p-4"
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-black/60">
                        Group Members ({groupMembers.length})
                      </h4>
                      {groupMembers.length > 0 ? (
                        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {groupMembers.map((member) => (
                            <li
                              key={member.studentNo}
                              className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-brand-black"
                            >
                              {member.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-brand-black/50">
                          No members were found for this group.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-brand-black/50">
                  No project has been assigned to your group yet.
                </p>
              )}
            </div>

            <ProgressCard
              label="My Progress"
              value={overallProgress}
              icon={TrendingUp}
              hint="Share of your group's deliverables that are submitted"
            />
          </section>

          <section>
            <CourseDeliverables
              deliverables={deliverables}
              title="Deliverables"
            />
          </section>

          {/* Real comments and ratings from Google Sheets — separated into
              Group Comments and Individual Comments sections. Individual
              comments are scoped to this student's studentNo server-side. */}
          <StudentCommentsSection
            groupCode={student.groupCode}
            studentNo={student.studentNo}
          />
        </>
      )}
    </div>
  );
}
