import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, FolderKanban } from "lucide-react";
import { getAllProjects } from "../services/projectService";
import ProjectCard from "../components/ProjectCard";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    async function loadProjects() {
      setIsLoading(true);
      const data = await getAllProjects();
      if (isCurrent) {
        setProjects(data);
        setIsLoading(false);
      }
    }
    loadProjects();
    return () => {
      isCurrent = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.title.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            All Technopreneurship Projects
          </h1>
          <p className="mt-1 text-sm text-brand-black/55">
            High-level overview of each team: title, description, size, and overall progress.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/35" />
          <input
            type="text"
            placeholder="Search by title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border bg-white text-sm placeholder:text-brand-black/35 focus:border-brand-black outline-none transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-brand-black/40 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading projects...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-brand-black/40" />
          </div>
          <p className="text-sm text-brand-black/50">
            No projects match &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard key={project.groupCode} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
