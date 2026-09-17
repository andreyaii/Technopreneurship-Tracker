import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authenticateStudent, authenticateAdviser, getStudentByStudentNo } from "../services/projectService";

/**
 * AuthContext
 * ------------------------------------------------------------------
 * Holds the authenticated student, including groupCode. After login the
 * app identifies their team from that field and the dashboard loads only
 * that group's deliverables and progress.
 *
 * Google Sheets / database authentication is not implemented yet. When it
 * is, replace `login` (and authenticateStudent in projectService) with a
 * server-side check. Keep returning { studentNo, name, section, groupCode }
 * so the UI does not change.
 *
 * Do not load another group's tracker from the URL. Project details
 * compare :groupCode to student.groupCode and redirect if they differ.
 * ------------------------------------------------------------------
 */

const AuthContext = createContext(undefined);

const STORAGE_KEY = "technopreneurship_auth_user";

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // True only while we're checking sessionStorage for an existing session
  // on first load — lets ProtectedRoute avoid a flash-redirect to /login
  // before we've had a chance to restore the session.
  const [isRestoring, setIsRestoring] = useState(true);

  // On mount, restore the session if the browser tab still has a
  // remembered studentNo (e.g. after a page refresh). We re-fetch the
  // student's public profile rather than trusting stored data, so this
  // mirrors how a real server-side session check would behave later.
  useEffect(() => {
    const storedUser = sessionStorage.getItem(STORAGE_KEY);
    if (!storedUser) {
      setIsRestoring(false);
      return;
    }

    let isCurrent = true;
    const stored = JSON.parse(storedUser);
    const restore = stored.role === "adviser" ? authenticateAdviser(stored.adviserNo, "1234") : getStudentByStudentNo(stored.studentNo);
    restore.then((found) => {
      if (!isCurrent) return;
      if (found) {
        setStudent(found);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      setIsRestoring(false);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const login = useCallback(async (identifier, pin, role = "student") => {
    setIsLoading(true);
    try {
      const matched = role === "adviser"
        ? await authenticateAdviser(identifier, pin)
        : await authenticateStudent(identifier, pin);
      if (matched) {
        setStudent(matched);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
        return { success: true };
      }
      return { success: false, message: role === "adviser" ? "Adviser ID or PIN is incorrect." : "Student number or PIN is incorrect." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    student, // { studentNo, name, section, groupCode } | null
    isAuthenticated: Boolean(student),
    isLoading,
    isRestoring,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
