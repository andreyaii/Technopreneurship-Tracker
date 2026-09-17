import { useState, useCallback, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Rocket,
  ListChecks,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isAuthenticated, isRestoring } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parallax cursor tracking
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0,
  });

  const handleMouseMove = useCallback((e) => {
    const { innerWidth, innerHeight } = window;
    // Normalized coordinates from -1 to 1 (0 at center)
    const normX = (e.clientX / innerWidth - 0.5) * 2;
    const normY = (e.clientY / innerHeight - 0.5) * 2;

    setMousePos({
      x: normX,
      y: normY,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  if (isRestoring) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Parallax offsets for abstract floating tech shapes
  const p1X = mousePos.x * 14;
  const p1Y = mousePos.y * 14;

  const p2X = mousePos.x * -26;
  const p2Y = mousePos.y * -26;

  const p3X = mousePos.x * 38;
  const p3Y = mousePos.y * 38;

  const p4X = mousePos.x * -45;
  const p4Y = mousePos.y * -45;

  return (
    <div className="relative min-h-screen bg-[#090A0D] text-white flex flex-col justify-between overflow-x-hidden font-sans select-none">
      {/* 1. Environment & Interactive Background (Strictly Solid / No Glassmorphism) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Subtle geometric dot matrix */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(#FDCC01 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            transform: `translate3d(${p1X * 0.3}px, ${p1Y * 0.3}px, 0)`,
          }}
        />

        {/* Ambient Dark Charcoal Foci */}
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#151720] blur-3xl opacity-50 transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(${p2X * 0.7}px, ${p2Y * 0.7}px, 0)` }}
        />
        <div
          className="absolute top-1/4 right-0 w-[650px] h-[650px] rounded-full bg-[#14151C] blur-3xl opacity-60 transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(${p1X * 0.5}px, ${p1Y * 0.5}px, 0)` }}
        />

        {/* Abstract Shape 1: 3D Isometric Wireframe Cube (Floating in right open space) */}
        <div
          className="absolute top-28 right-16 lg:right-48 transition-transform duration-300 ease-out"
          style={{ transform: `translate3d(${p3X}px, ${p3Y}px, 0)` }}
        >
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            className="opacity-75 animate-float-1"
          >
            {/* Top face */}
            <polygon
              points="90,25 155,62 90,100 25,62"
              fill="#14161F"
              stroke="#2C3242"
              strokeWidth="1.8"
            />
            {/* Left face */}
            <polygon
              points="25,62 90,100 90,165 25,128"
              fill="#0F1117"
              stroke="#2C3242"
              strokeWidth="1.8"
            />
            {/* Right face with yellow accent line */}
            <polygon
              points="90,100 155,62 155,128 90,165"
              fill="#161822"
              stroke="#FDCC01"
              strokeWidth="1.8"
              strokeDasharray="5 3"
            />
            {/* Glowing corner nodes */}
            <circle cx="90" cy="100" r="4.5" fill="#FDCC01" />
            <circle cx="155" cy="62" r="3" fill="#FDCC01" />
            <circle cx="90" cy="25" r="3" fill="#2C3242" />
          </svg>
        </div>

        {/* Abstract Shape 2: Solid Hexagonal Tech Node (Mid-Right space) */}
        <div
          className="absolute top-1/2 right-12 lg:right-32 transition-transform duration-300 ease-out"
          style={{ transform: `translate3d(${p4X}px, ${p4Y}px, 0)` }}
        >
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            fill="none"
            className="opacity-60 animate-float-2"
          >
            <polygon
              points="70,18 122,48 122,108 70,138 18,108 18,48"
              fill="#12141C"
              stroke="#2B3142"
              strokeWidth="1.8"
            />
            <polygon
              points="70,40 100,58 100,92 70,110 40,92 40,58"
              fill="#181B26"
              stroke="#FDCC01"
              strokeWidth="1.5"
            />
            <circle cx="70" cy="75" r="5" fill="#FDCC01" />
            <line x1="70" y1="18" x2="70" y2="40" stroke="#FDCC01" strokeWidth="1.5" />
            <line x1="122" y1="108" x2="100" y2="92" stroke="#FDCC01" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Abstract Shape 3: Geometric Diamond Wireframe (Lower Right) */}
        <div
          className="absolute bottom-24 right-24 lg:right-64 transition-transform duration-300 ease-out"
          style={{ transform: `translate3d(${p2X * 1.3}px, ${p2Y * 1.3}px, 0)` }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-50">
            <rect
              x="60"
              y="15"
              width="64"
              height="64"
              transform="rotate(45 60 15)"
              fill="#13151D"
              stroke="#2D3344"
              strokeWidth="1.5"
            />
            <circle cx="60" cy="60" r="3.5" fill="#FDCC01" />
            <line x1="60" y1="20" x2="60" y2="100" stroke="#2D3344" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="60" x2="100" y2="60" stroke="#2D3344" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Abstract Shape 4: Subtle Crosshair Node (Mid-Left) */}
        <div
          className="absolute top-1/3 left-8 hidden xl:block transition-transform duration-300 ease-out"
          style={{ transform: `translate3d(${p1X * 1.5}px, ${p1Y * 1.5}px, 0)` }}
        >
          <div className="flex flex-col gap-6 opacity-30">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 border-t border-l border-brand-yellow"></span>
              <div className="w-8 h-[1px] bg-[#2C3242]"></div>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow"></span>
            </div>
            <div className="w-20 h-[1px] bg-[#2C3242]/50"></div>
          </div>
        </div>
      </div>

      {/* 2. Header (Simplified: ONLY logo and title) */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center shadow-md">
            <Rocket className="w-5 h-5 text-brand-black" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">
            Technopreneurship Tracker
          </span>
        </div>
      </header>

      {/* 3. Main Content (Distraction-Free, Let Background Breathe) */}
      <main className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-20 my-auto">
        <div className="max-w-2xl flex flex-col items-start">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-[1.15]">
            Stay on top of your{" "}
            <span className="text-brand-yellow">deliverables.</span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-base sm:text-lg text-gray-300 leading-relaxed font-sans">
            Keep track of your deliverables, submission status, quizzes, and
            deadlines without the guesswork. Sign in to see your own progress
            and stay on track throughout the semester.
          </p>

          {/* Feature List (3 bullet points with clean vector icons) */}
          <div className="mt-8 flex flex-col gap-3.5 w-full max-w-lg">
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#12141C] border border-[#212533]">
              <div className="w-9 h-9 rounded-lg bg-[#191D28] flex items-center justify-center shrink-0 border border-[#2B3244]">
                <ListChecks className="w-4 h-4 text-brand-yellow" strokeWidth={2.25} />
              </div>
              <p className="text-sm font-semibold text-white/90">
                Track your deliverables and deadlines
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#12141C] border border-[#212533]">
              <div className="w-9 h-9 rounded-lg bg-[#191D28] flex items-center justify-center shrink-0 border border-[#2B3244]">
                <TrendingUp className="w-4 h-4 text-brand-yellow" strokeWidth={2.25} />
              </div>
              <p className="text-sm font-semibold text-white/90">
                Monitor personal quiz scores
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#12141C] border border-[#212533]">
              <div className="w-9 h-9 rounded-lg bg-[#191D28] flex items-center justify-center shrink-0 border border-[#2B3244]">
                <Users className="w-4 h-4 text-brand-yellow" strokeWidth={2.25} />
              </div>
              <p className="text-sm font-semibold text-white/90">
                Browse topics across other teams
              </p>
            </div>
          </div>

          {/* 4. The Single Call-to-Action (CTA): ONLY clickable entry point */}
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-xl bg-brand-yellow text-brand-black text-base font-bold shadow-lg hover:bg-brand-yellow-dark hover:shadow-yellow-400/20 active:scale-95 transition-all duration-200 cursor-pointer group"
            >
              <span>Get Started</span>
              <ArrowRight
                className="w-5 h-5 text-brand-black group-hover:translate-x-1 transition-transform"
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>
      </main>

      {/* 2. Footer (Simplified & Minimal) */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 py-6 border-t border-[#181A24] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>ESQ38 - Technopreneurship - Cebu Institute of Technology - University</p>
        <p>A.Y. 2026-2027</p>
      </footer>

      {/* 5. The Login Modal (Solid White Card with 3D Lift, Strictly No Glassmorphism) */}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
