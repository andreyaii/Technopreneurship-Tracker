import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Rocket,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const STUDENT_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "All Projects", icon: FolderKanban },
];

const ADVISER_LINKS = [
  { to: "/adviser", label: "Adviser Dashboard", icon: ShieldCheck },
  { to: "/projects", label: "All Projects", icon: FolderKanban },
];

export default function Navbar() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdviser = student?.role === "adviser";
  const LINKS = isAdviser ? ADVISER_LINKS : STUDENT_LINKS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Show initials: for adviser use name directly, for student split by comma
  const initials = student?.name
    ? isAdviser
      ? student.name
          .split(" ")
          .map((w) => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : student.name.split(",")[0].trim().slice(0, 2).toUpperCase()
    : "";

  const displayName = student?.name
    ? isAdviser
      ? student.name
      : student.name.split(",")[0]
    : "";

  const displaySub = isAdviser
    ? student?.roleName || "Adviser"
    : student?.studentNo || "";

  return (
    <header
      className="sticky top-0 z-50 bg-brand-black text-white border-b border-white/10 shadow-sm"
      style={{ position: "sticky", top: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] sm:h-20">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center shadow-sm">
              <Rocket className="w-5 h-5 text-brand-black" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-base sm:text-lg tracking-tight">
                Technopreneurship Tracker
              </p>
              <p className="text-xs text-white/60 hidden sm:block">
                {isAdviser ? "Adviser Portal" : "ES038 · Project Progress System"}
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-yellow text-brand-black shadow-sm"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User profile + logout */}
          <div className="hidden md:flex items-center gap-4">
            {student && (
              <div className="flex items-center gap-3 pl-4 border-l border-white/15">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold border ${
                    isAdviser
                      ? "bg-brand-yellow text-brand-black border-brand-yellow/80"
                      : "bg-white/10 text-white border-white/10"
                  }`}
                >
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-white/50">{displaySub}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors"
              title="Log out"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2.25} />
              <span className="hidden lg:inline">Log out</span>
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 pb-5 pt-3 bg-brand-black">
          {student && (
            <div className="flex items-center gap-3 py-3 mb-2 border-b border-white/10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                  isAdviser
                    ? "bg-brand-yellow text-brand-black border-brand-yellow/80"
                    : "bg-white/10 text-white border-white/10"
                }`}
              >
                {initials}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-white/50">{displaySub}</p>
              </div>
            </div>
          )}
          <nav className="flex flex-col gap-1.5 py-2">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-yellow text-brand-black"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <Icon className="w-5 h-5" strokeWidth={2.25} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-5 h-5" strokeWidth={2.25} />
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
