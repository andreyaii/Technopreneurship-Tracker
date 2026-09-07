import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, LogOut, Rocket, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "All Projects", icon: FolderKanban },
];

export default function Navbar() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = student?.name
    ? student.name
        .split(",")[0]
        .trim()
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-40 bg-brand-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-yellow flex items-center justify-center">
              <Rocket className="w-[18px] h-[18px] text-brand-black" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-sm sm:text-base tracking-tight">
                Technopreneurship Tracker
              </p>
              <p className="text-[11px] text-white/50 hidden sm:block">
                ES038 · Project Progress System
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-yellow text-brand-black"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={2.25} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Student profile + logout */}
          <div className="hidden md:flex items-center gap-3">
            {student && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{student.name.split(",")[0]}</p>
                  <p className="text-[11px] text-white/50">{student.studentNo}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" strokeWidth={2.25} />
              <span className="hidden lg:inline">Log out</span>
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 pb-4 pt-2">
          {student && (
            <div className="flex items-center gap-2.5 py-3 mb-1 border-b border-white/10">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium">{student.name.split(",")[0]}</p>
                <p className="text-[11px] text-white/50">{student.studentNo}</p>
              </div>
            </div>
          )}
          <nav className="flex flex-col gap-1 py-2">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-yellow text-brand-black"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={2.25} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2.25} />
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
