import { useEffect, useState, useMemo } from "react";
import {
  Users2,
  ShieldCheck,
  FolderKanban,
  ChevronDown,
  Search,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { getAllProjects } from "../services/projectService";
import AdviserCommentForm from "../components/AdviserCommentForm";
import PaginatedGrid from "../components/PaginatedGrid";

/**
 * AdviserDashboard
 *
 * Gives the authenticated adviser:
 *  1. A welcome header with their name/role
 *  2. A group selector (search + dropdown from all projects)
 *  3. On group selection: shows AdviserCommentForm (comments + ratings)
 */
export default function AdviserDashboard() {
  const { student: adviser } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function load() {
      setLoadingProjects(true);
      try {
        const data = await getAllProjects();
        if (isCurrent) setProjects(data);
      } finally {
        if (isCurrent) setLoadingProjects(false);
      }
    }
    load();
    return () => {
      isCurrent = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.groupCode.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleSelectGroup = (project) => {
    setSelectedGroup(project);
    setSearchQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-brand-black/50" strokeWidth={2.25} />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-black/40">
            Adviser Mode
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          Welcome,{" "}
          <span className="text-brand-black">{adviser?.name || "Adviser"}</span>
        </h1>
        <p className="mt-1 text-sm text-brand-black/55">
          Select a group to post feedback, comments, and ratings.
        </p>
      </div>

      {/* Group Selection */}
      <section className="rounded-2xl border border-surface-border bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center border border-brand-yellow/30">
            <FolderKanban className="w-4 h-4 text-brand-black" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
              Select Group
            </h2>
            <p className="text-xs text-brand-black/50">
              Search by project title or group code
            </p>
          </div>
        </div>

        {loadingProjects ? (
          <div className="flex items-center gap-2.5 text-sm text-brand-black/60 py-4">
            <LoadingSpinner size="sm" text="Loading groups..." inline={false} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/35" />
              <input
                type="text"
                placeholder="Search project title or group code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-border bg-surface-muted text-sm placeholder:text-brand-black/35 focus:border-brand-black focus:bg-white outline-none transition-colors"
              />
            </div>

            {/* Group list */}
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-brand-black/40">
                No groups match your search.
              </div>
            ) : (
              <PaginatedGrid
                items={filtered}
                initialPageSize={9}
                pageSizeOptions={[10, 25, 50, 100]}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {(p) => (
                  <button
                    key={p.groupCode}
                    type="button"
                    onClick={() => handleSelectGroup(p)}
                    className={`text-left rounded-xl border p-4 transition-all hover:shadow-card-hover cursor-pointer ${
                      selectedGroup?.groupCode === p.groupCode
                        ? "border-brand-black bg-brand-black text-white"
                        : "border-surface-border bg-surface-muted/50 hover:border-brand-black/30 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold leading-snug truncate ${
                            selectedGroup?.groupCode === p.groupCode
                              ? "text-white"
                              : "text-brand-black"
                          }`}
                        >
                          {p.title}
                        </p>
                        <p
                          className={`text-xs font-mono mt-0.5 truncate ${
                            selectedGroup?.groupCode === p.groupCode
                              ? "text-white/70"
                              : "text-brand-black/50"
                          }`}
                        >
                          {p.groupCode}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs font-medium shrink-0 ${
                          selectedGroup?.groupCode === p.groupCode
                            ? "text-white/70"
                            : "text-brand-black/50"
                        }`}
                      >
                        <Users2 className="w-3.5 h-3.5" strokeWidth={2.25} />
                        {p.memberCount}
                      </div>
                    </div>
                    {selectedGroup?.groupCode === p.groupCode && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-yellow">
                        <ChevronDown className="w-3 h-3" />
                        Selected
                      </div>
                    )}
                  </button>
                )}
              </PaginatedGrid>
            )}
          </div>
        )}
      </section>

      {/* Comment + Rating Form (only shown when group is selected) */}
      {selectedGroup && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-yellow" />
            <h2 className="text-base font-display font-bold">
              Posting to:{" "}
              <span className="text-brand-black">{selectedGroup.title}</span>
              <span className="ml-2 text-xs font-mono font-normal text-brand-black/50">
                ({selectedGroup.groupCode})
              </span>
            </h2>
          </div>

          <AdviserCommentForm
            groupCode={selectedGroup.groupCode}
            groupLabel={selectedGroup.title}
          />
        </div>
      )}
    </div>
  );
}
