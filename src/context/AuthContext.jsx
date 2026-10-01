import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  authenticateStudent,
  authenticateAdviser,
} from "../services/projectService";

/**
 * AuthContext
 * ------------------------------------------------------------------
 * Holds the authenticated user (student or adviser).
 *
 * `student` (poorly named historically) now holds EITHER a student or an
 * adviser object — both shapes are stored in sessionStorage and restored
 * on refresh. Components distinguish them with `student.role`.
 *
 * Student shape:
 *   { role: "student", studentNo, name, section, groupCode, mentor, ... }
 *
 * Adviser shape:
 *   { role: "adviser", adviserNo, name, roleName }
 *
 * Session restore: students are re-fetched from mock data (fast, offline).
 * Advisers store only their safe object — no PIN is ever persisted.
 * ------------------------------------------------------------------
 */

const AuthContext = createContext(undefined);

const STORAGE_KEY = "technopreneurship_auth_user";

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsRestoring(false);
      return;
    }

    let stored;

    try {
      stored = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      setIsRestoring(false);
      return;
    }

    // Both student and adviser sessions store only the safe, authenticated profile
    // object in sessionStorage. Restoring directly avoids unauthenticated
    // network calls that could expose or probe student data.
    if (stored && (stored.role === "student" || stored.role === "adviser")) {
      setStudent(stored);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setIsRestoring(false);
  }, []);

  const login = useCallback(async (identifier, pin, role = "student") => {
    setIsLoading(true);
    try {
      const matched =
        role === "adviser"
          ? await authenticateAdviser(identifier, pin)
          : await authenticateStudent(identifier, pin);

      if (matched) {
        setStudent(matched);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
        return { success: true };
      }

      return {
        success: false,
        message:
          role === "adviser"
            ? "Adviser ID or PIN is incorrect."
            : "Student number or PIN is incorrect.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    student, // { role, studentNo|adviserNo, name, ... } | null
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
