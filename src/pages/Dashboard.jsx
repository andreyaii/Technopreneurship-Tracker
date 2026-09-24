import { useEffect, useState } from "react";
import {
  IdCard,
  Users2,
  Hash,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getProjectByGroupCode,
  getProjectMemberCount,
  getGroupDeliverables,
  getGroupSubmissionProgress,
  getProjectNotes,
} from "../services/projectService";
import ProgressCard from "../components/ProgressCard";
import CourseDeliverables from "../components/CourseDeliverables";
import MentorCommentsCard from "../components/MentorCommentsCard";

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
  // are never fetched here. When Google Sheets auth lands, keep using
  // student.groupCode from AuthContext — not a URL parameter.
  const { student } = useAuth();

  const [project, setProject] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [deliverables, setDeliverables] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [notes, setNotes] = useState({ studentComment: "", adviserFeedback: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!student?.groupCode) return;

    let isCurrent = true;

    async function loadDashboardData() {
      setIsLoading(true);
      const [projectData, count, groupDeliverables, progress, projectNotes] = await Promise.all([
        getProjectByGroupCode(student.groupCode),
        getProjectMemberCount(student.groupCode),
        getGroupDeliverables(student),
        getGroupSubmissionProgress(student),
        getProjectNotes(student.groupCode),
      ]);

      if (!isCurrent) return;
      setProject(projectData);
      setMemberCount(count);
      setDeliverables(groupDeliverables);
      setOverallProgress(progress);
      setNotes(projectNotes);
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
        <div className="flex items-center justify-center py-24 text-brand-black/40 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your dashboard...</span>
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
              <InfoTile icon={GraduationCap} label="Mentor" value={student.mentor || "Engr. Jonathan A. Cartilla"} />
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1">
                      <Users2 className="w-3 h-3" />
                      {memberCount} members
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-brand-black/50">
                  No project has been assigned to your group yet.
                </p>
              )}
            </div>

            <ProgressCard
              label="Group Progress"
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

          <MentorCommentsCard
            notes={notes}
            setNotes={setNotes}
            groupCode={student.groupCode}
            mentorName={student.mentor || "Engr. Jonathan A. Cartilla"}
            isAdviser={false}
          />
        </>
      )}
    </div>
  );
}
