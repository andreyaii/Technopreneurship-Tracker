import { useEffect, useState } from "react";
import {
  IdCard,
  Users2,
  Hash,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ChevronDown,
  RotateCcw,
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
  const [dataErrors, setDataErrors] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!student?.groupCode) return;

    let isCurrent = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setDataErrors([]);
      const hasStudentDeliverables =
        Array.isArray(student.deliverables) && student.deliverables.length > 0;
      const needsGroupProgress =
        !hasStudentDeliverables && typeof student.progress !== "number";

      try {
        const [
          projectResult,
          membersResult,
          deliverablesResult,
          progressResult,
        ] = await Promise.allSettled([
            getProjectByGroupCode(student.groupCode),
            getGroupMembers(student.groupCode),
            hasStudentDeliverables
              ? Promise.resolve(null)
              : getGroupDeliverables(student.groupCode),
            needsGroupProgress
              ? getGroupSubmissionProgress(student.groupCode)
              : Promise.resolve(null),
          ]);

        const errors = [];
        const projectData =
          projectResult.status === "fulfilled" ? projectResult.value : null;
        const members =
          membersResult.status === "fulfilled" ? membersResult.value : [];
        const groupDeliverables =
          deliverablesResult.status === "fulfilled"
            ? deliverablesResult.value
            : [];
        const groupProgress =
          progressResult.status === "fulfilled"
            ? progressResult.value
            : null;

        if (projectResult.status === "rejected") errors.push("project details");
        if (membersResult.status === "rejected") errors.push("group members");
        if (!hasStudentDeliverables && deliverablesResult.status === "rejected") {
          errors.push("deliverables");
        }
        if (needsGroupProgress && progressResult.status === "rejected") {
          errors.push("progress");
        }

        const userDeliverables = hasStudentDeliverables
          ? student.deliverables
          : groupDeliverables;

        const userProgress = hasStudentDeliverables
          ? Math.round(
              (student.deliverables.filter(
                (item) => item.status === "Submitted" || item.isSubmitted === true
              ).length / student.deliverables.length) * 100
            )
          : typeof student.progress === "number"
            ? student.progress
            : groupProgress ?? 0;

        if (!isCurrent) return;
        setProject(projectData);
        setGroupMembers(members);
        setShowGroupMembers(false);
        setDeliverables(userDeliverables);
        setOverallProgress(userProgress);
        setDataErrors(errors);
      } catch (err) {
        if (!isCurrent) return;
        setDataErrors([err?.message || "Failed to load dashboard data"]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isCurrent = false;
    };
  }, [student, reloadKey]);

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

      {!student.groupCode ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
            <Users2 className="w-5 h-5 text-brand-black/40" />
          </div>
          <p className="text-sm text-brand-black/50">
            No group is assigned to your account yet.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24 text-brand-black/60">
          <LoadingSpinner size="md" text="Loading your dashboard..." />
        </div>
      ) : (
        <>
          {dataErrors.length > 0 && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <span>
                Some dashboard data could not be loaded: {dataErrors.join(", ")}.
              </span>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}
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
              hint="Share of your deliverables that are completed"
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
