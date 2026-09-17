import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

/**
 * ProtectedRoute
 * Redirects to /login if there is no authenticated student in context.
 * Waits for `isRestoring` to finish first, so a page refresh doesn't
 * briefly bounce an already-logged-in student to /login before their
 * session has been restored from sessionStorage.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted text-brand-black/40 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <Navbar />
      <main className="flex-1 bg-surface-muted">{children}</main>
    </div>
  );
}
