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
  },
};
