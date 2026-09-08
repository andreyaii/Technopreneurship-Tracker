import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getProjectByGroupCode,
  getProjectMemberCount,
  getGroupDeliverables,
  getProjectOverallProgress,
} from "../services/projectService";
import ProjectDetails from "../components/ProjectDetails";

/**
 * Own-group details only. Other group codes redirect away so students
 * cannot open another team's tracker via the URL.
 * Ready for Sheets auth: keep comparing params to student.groupCode.
 */
export default function ProjectDetailsPage() {
  const { groupCode } = useParams();
  const { student } = useAuth();

  const [project, setProject] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnGroup = Boolean(student?.groupCode && student.groupCode === groupCode);

  useEffect(() => {
    if (!isOwnGroup) return;

    let isCurrent = true;

    async function loadDetails() {
      setIsLoading(true);
      setNotFound(false);

      const projectData = await getProjectByGroupCode(groupCode);
      if (!projectData) {
        if (isCurrent) {
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      const [count, groupDeliverables, progress] = await Promise.all([
        getProjectMemberCount(groupCode),
        getGroupDeliverables(groupCode),
        getProjectOverallProgress(groupCode),
      ]);

      if (!isCurrent) return;
      setProject({ ...projectData, progress });
      setMemberCount(count);
      setDeliverables(groupDeliverables);
      setIsLoading(false);
    }

    loadDetails();
    return () => {
      isCurrent = false;
    };
  }, [groupCode, isOwnGroup]);

  if (student && !isOwnGroup) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-black/60 hover:text-brand-black transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.25} />
        Back to Dashboard
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-brand-black/40 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading project details...</span>
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
      ) : (
        <ProjectDetails
          project={project}
          memberCount={memberCount}
          deliverables={deliverables}
        />
      )}
    </div>
  );
}
