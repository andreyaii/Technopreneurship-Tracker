import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, SearchX, RotateCcw } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import {
  getProjectByGroupCode,
  getGroupMembers,
  getGroupDeliverables,
  getProjectOverallProgress,
} from "../services/projectService";
import ProjectDetails from "../components/ProjectDetails";

/**
 * Own-group details only. Other group codes redirect away so students
 * cannot open another team's tracker via the URL.
 * Advisers can access any group's project detail page.
 */
export default function ProjectDetailsPage() {
  const { groupCode } = useParams();
  const { student } = useAuth();

  const [project, setProject] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dataErrors, setDataErrors] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const isAdviser = student?.role === "adviser";

  const isOwnGroup = Boolean(
    isAdviser ||
    (student?.groupCode && student.groupCode === groupCode)
  );

  useEffect(() => {
    if (!isOwnGroup) return;

    let isCurrent = true;

    async function loadDetails() {
      setIsLoading(true);
      setNotFound(false);
      setLoadError("");
      setDataErrors([]);

      try {
        const projectData = await getProjectByGroupCode(groupCode);

        if (!isCurrent) return;
        if (!projectData) {
          setNotFound(true);
          return;
        }

        const [membersResult, progressResult, deliverablesResult] =
          await Promise.allSettled([
            getGroupMembers(groupCode),
            getProjectOverallProgress(groupCode),
            isAdviser
              ? getGroupDeliverables(groupCode)
              : Promise.resolve(student?.deliverables || []),
          ]);

        if (!isCurrent) return;

        const errors = [];
        const projectMembers =
          membersResult.status === "fulfilled" ? membersResult.value : [];
        const progress =
          progressResult.status === "fulfilled" ? progressResult.value : 0;
        const projectDeliverables =
          deliverablesResult.status === "fulfilled"
            ? deliverablesResult.value
            : [];

        if (membersResult.status === "rejected") errors.push("group members");
        if (progressResult.status === "rejected") errors.push("project progress");
        if (deliverablesResult.status === "rejected") errors.push("deliverables");

        setProject({ ...projectData, progress });
        setMemberCount(projectMembers.length);
        setMembers(projectMembers);
        setDeliverables(projectDeliverables);
        setDataErrors(errors);
      } catch (err) {
        if (!isCurrent) return;
        setLoadError(err?.message || "Failed to load project details.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDetails();

    return () => {
      isCurrent = false;
    };
  }, [
    groupCode,
    isOwnGroup,
    isAdviser,
    student?.deliverables,
    reloadKey,
  ]);

  if (student && !isOwnGroup) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <Link
        to={isAdviser ? "/projects" : "/dashboard"}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-black/60 hover:text-brand-black transition-colors w-fit"
      >
        <ArrowLeft
          className="w-4 h-4"
          strokeWidth={2.25}
        />
        Back to Dashboard
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-brand-black/60">
          <LoadingSpinner
            size="md"
            text="Loading project details..."
          />
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
            <SearchX className="w-5 h-5 text-brand-black/40" />
          </div>

          <p className="text-sm text-brand-black/50">
            No project found for your group.
          </p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-sm text-rose-600">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-surface-border hover:bg-surface-muted transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <>
          {dataErrors.length > 0 && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <span>
                Some project data could not be loaded: {dataErrors.join(", ")}.
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
          <ProjectDetails
            project={project}
            memberCount={memberCount}
            members={members}
            deliverables={deliverables}
            isAdviser={isAdviser}
            initialMembers={members}
          />
        </>
      )}
    </div>
  );
}