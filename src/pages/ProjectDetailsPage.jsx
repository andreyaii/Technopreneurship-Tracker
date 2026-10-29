import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, SearchX, RotateCcw } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useProjectDetails } from "../services/projectService";
import ProjectDetails from "../components/ProjectDetails";

/**
 * Own-group details only. Other group codes redirect away so students
 * cannot open another team's tracker via the URL.
 * Advisers can access any group's project detail page.
 */
export default function ProjectDetailsPage() {
  const { groupCode } = useParams();
  const { student } = useAuth();
  const isAdviser = student?.role === "adviser";

  const isOwnGroup = Boolean(
    isAdviser ||
    (student?.groupCode && student.groupCode === groupCode)
  );

  const {
    data: detailData,
    isLoading,
    error,
    refetch,
  } = useProjectDetails(groupCode, { student, isAdviser }, { enabled: isOwnGroup });

  const project = detailData?.project || null;
  const memberCount = detailData?.memberCount || 0;
  const members = detailData?.members || [];
  const deliverables = detailData?.deliverables || [];
  const notFound = Boolean(detailData?.notFound);
  const loadError = error ? (error.message || "Failed to load project details.") : "";
  const dataErrors = detailData?.dataErrors || [];

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
            onClick={() => refetch()}
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