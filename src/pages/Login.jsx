import { Navigate } from "react-router-dom";
import { Rocket, ListChecks, Users, TrendingUp } from "lucide-react";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[45%_55%] bg-white">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-black text-white p-12 lg:p-14 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-yellow/10"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-yellow/5 -translate-x-1/3 translate-y-1/3"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-yellow flex items-center justify-center">
            <Rocket className="w-5 h-5 text-brand-black" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold tracking-tight">
            Technopreneurship Tracker
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-display font-bold leading-tight">
            Track your Techno project,
            <span className="text-brand-yellow"> step by step.</span>
          </h1>
          <p className="mt-4 text-white/60 text-sm leading-relaxed">
            After you sign in you will only see your own group&apos;s
            deliverables, submission dates, and overall progress.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: ListChecks, text: "See Submitted or Missing for each item" },
              { icon: Users, text: "Your group's project only" },
              { icon: TrendingUp, text: "Track overall group progress" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-yellow" strokeWidth={2.25} />
                </div>
                <p className="text-sm text-white/80">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/30">
          ES038 · Technopreneurship &middot; A.Y. 2026&ndash;2027
        </p>
      </div>

      {/* Login form panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
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
