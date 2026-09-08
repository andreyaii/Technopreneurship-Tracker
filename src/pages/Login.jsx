import { useState, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Rocket, ListChecks, Users, TrendingUp } from "lucide-react";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isAuthenticated, isRestoring } = useAuth();
  const leftPanelRef = useRef(null);

  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0,
    pixelX: 0,
    pixelY: 0,
    isHovered: false,
    orb1Proximity: 0,
    orb2Proximity: 0,
  });

  const handleMouseMove = useCallback((e) => {
    if (!leftPanelRef.current) return;
    const rect = leftPanelRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    // Normalized from -1 to 1 (0 at center)
    const normX = ((pixelX / rect.width) - 0.5) * 2;
    const normY = ((pixelY / rect.height) - 0.5) * 2;

    // Orb center locations relative to left panel
    const orb1Center = { x: rect.width, y: 0 };
    const orb2Center = { x: 0, y: rect.height };

    const maxDist = Math.max(rect.width, rect.height) * 0.75;
    const dist1 = Math.hypot(pixelX - orb1Center.x, pixelY - orb1Center.y);
    const dist2 = Math.hypot(pixelX - orb2Center.x, pixelY - orb2Center.y);

    const orb1Proximity = Math.max(0, Math.min(1, 1 - dist1 / maxDist));
    const orb2Proximity = Math.max(0, Math.min(1, 1 - dist2 / maxDist));

    setMousePos({
      x: normX,
      y: normY,
      pixelX,
      pixelY,
      isHovered: true,
      orb1Proximity,
      orb2Proximity,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({
      ...prev,
      x: 0,
      y: 0,
      isHovered: false,
      orb1Proximity: 0,
      orb2Proximity: 0,
    }));
  }, []);

  if (isRestoring) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[45%_55%] bg-white">
      {/* Brand panel (Left Dark Side) */}
      <div
        ref={leftPanelRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setMousePos((p) => ({ ...p, isHovered: true }))}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:flex flex-col justify-between bg-brand-black text-white p-12 lg:p-14 relative overflow-hidden select-none"
      >
        {/* Soft Radial Cursor Follower Spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl z-0 transition-opacity duration-300 ease-out"
          style={{
            transform: `translate3d(${mousePos.pixelX - 128}px, ${mousePos.pixelY - 128}px, 0)`,
            opacity: mousePos.isHovered ? 1 : 0,
          }}
        />

        {/* Top-Right Defined Geometric Circle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 lg:w-96 lg:h-96 rounded-full transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 12}px, 0)`,
          }}
        >
          <div
            className="w-full h-full rounded-full bg-brand-yellow/15 animate-float-1 transition-all duration-300"
            style={{
              opacity: 0.8 + mousePos.orb1Proximity * 0.4,
              transform: `scale(${1 + mousePos.orb1Proximity * 0.05})`,
            }}
          />
        </div>

        {/* Bottom-Left Defined Geometric Circle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 lg:w-80 lg:h-80 rounded-full transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * -14}px, ${mousePos.y * -14}px, 0) translate(-33.33%, 33.33%)`,
          }}
        >
          <div
            className="w-full h-full rounded-full bg-brand-yellow/10 animate-float-2 transition-all duration-300"
            style={{
              opacity: 0.8 + mousePos.orb2Proximity * 0.4,
              transform: `scale(${1 + mousePos.orb2Proximity * 0.05})`,
            }}
          />
        </div>

        {/* Logo / Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-yellow flex items-center justify-center shadow-sm">
            <Rocket className="w-5 h-5 text-brand-black" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold tracking-tight">
            Technopreneurship Tracker
          </span>
        </div>

        {/* Main headline and feature checklist */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-display font-bold leading-tight">
            Stay on top of your
            <span className="text-brand-yellow"> deliverables.</span>
          </h1>
          <p className="mt-4 text-white/60 text-sm leading-relaxed">
            Keep track of your deliverables, submission status, quizzes, and
            deadlines without the guesswork. Sign in to see your own progress
            and stay on track throughout the semester.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: ListChecks, text: "Track your deliverables and deadlines" },
              { icon: TrendingUp, text: "Monitor personal quiz scores" },
              { icon: Users, text: "Browse topics across other teams" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                  <Icon className="w-4 h-4 text-brand-yellow" strokeWidth={2.25} />
                </div>
                <p className="text-sm text-white/80">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-white/30">
          ES038 · Technopreneurship &middot; A.Y. 2026&ndash;2027
        </p>
      </div>

      {/* Login form panel (Right Side) */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-brand-yellow flex items-center justify-center">
              <Rocket className="w-5 h-5 text-brand-black" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold tracking-tight text-brand-black">
              Technopreneurship Tracker
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-black">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-brand-black/55">
            Log in with your Student Number and PIN to view your project.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-xs text-center text-brand-black/40">
            Forgot your PIN? Ask your instructor or class coordinator.
          </p>
        </div>
      </div>
    </div>
  );
}
