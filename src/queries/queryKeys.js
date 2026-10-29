export const TECHNOPRENEURSHIP_SUBJECT = "technopreneurship";

export function getUserQueryScope(user, subject = TECHNOPRENEURSHIP_SUBJECT) {
  const principalId =
    user?.role === "adviser"
      ? user.adviserNo
      : user?.role === "student"
        ? user.studentNo
        : null;

  if (!principalId) return null;

  return {
    role: user.role,
    principalId: String(principalId),
    subject,
  };
}

export const queryKeys = {
  projects: {
    list: (scope) => [
      "projects",
      scope?.role ?? null,
      scope?.principalId ?? null,
      scope?.subject ?? null,
      "list",
    ],
    detail: (groupCode) => ["projects", "detail", groupCode ?? null],
    members: (groupCode) => ["projects", "members", groupCode ?? null],
    deliverables: (groupCode) => ["projects", "deliverables", groupCode ?? null],
    progress: (groupCode) => ["projects", "progress", groupCode ?? null],
    stats: (scope) => ["projects", "stats", scope?.principalId ?? null],
  },
  dashboard: (groupCode, studentNo) => [
    "dashboard",
    groupCode ?? null,
    studentNo ?? null,
  ],
  dashboardStats: (studentId) => [
    "dashboard",
    "stats",
    studentId ?? null,
  ],
  comments: {
    group: (groupCode) => ["comments", "group", groupCode ?? null],
    individual: (studentNo) => ["comments", "individual", studentNo ?? null],
  },
  ratings: (groupCode, studentNo) => [
    "ratings",
    groupCode ?? null,
    studentNo ?? null,
  ],
};
