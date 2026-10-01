import { Navigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

/**
 * ProtectedRoute
 *
 * Redirects to /login if there is no authenticated user.
 * Waits for `isRestoring` to finish first, so a page refresh doesn't
 * briefly bounce an already-logged-in user to /login.
 *
 * If `requiredRole` is provided (e.g. "adviser"), also verifies that the
 * authenticated user's role matches before rendering children.
 * Students trying to reach /adviser are redirected to /dashboard.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { student, isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111] text-white">
        <LoadingSpinner size="lg" text="Loading..." color="brand" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-gating: redirect to appropriate default page for the wrong role
  if (requiredRole && student?.role !== requiredRole) {
    const fallback = student?.role === "adviser" ? "/adviser" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  // Redirect adviser away from the student-only dashboard
  if (!requiredRole && student?.role === "adviser" && window.location.pathname === "/dashboard") {
    return <Navigate to="/adviser" replace />;
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <Navbar />
      <main className="flex-1 bg-surface-muted">{children}</main>
    </div>
  );
}
