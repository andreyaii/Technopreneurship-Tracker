/**
 * projectService.js
 * ------------------------------------------------------------------
 * Data-access layer. Pages and components ONLY talk to this file —
 * never to src/data/mockData.js or mockDeliverables.js directly.
 *
 * Today every function reads mock data. Later, swap each body for a
 * fetch() to a Google Apps Script Web App, keeping the same names and
 * return shapes. Authentication against Google Sheets is not wired yet;
 * `authenticateStudent` stays mock until that connection exists.
 *
 * Student-facing data is always scoped by the logged-in student's
 * groupCode. Detail views (dashboard, group deliverables) must never
 * be loaded for another team.
 *
 *   React UI  ->  projectService.js  ->  [mock today | Apps Script later]
 * ------------------------------------------------------------------
 */

import {
  students,
  projects,
  studentRequirements,
  requirementDefs,
} from "../data/mockData";
import {
  deliverableCatalog,
  groupSubmissions,
} from "../data/mockDeliverables";

const resolveAsync = (value) => Promise.resolve(value);

function toPublicStudent(student) {
  if (!student) return undefined;
  const { pin: _omit, ...safeStudent } = student;
  return safeStudent;
}

function mergeGroupDeliverable(item, submission) {
  if (submission) {
    return {
      ...item,
      isSubmitted: true,
      submittedDate: submission.submittedDate,
      status: "Submitted",
    };
  }
  return {
    ...item,
    isSubmitted: false,
    submittedDate: null,
    status: "Missing",
  };
}

/**
 * Look up a single student by student number (no PIN).
 */
export async function getStudentByStudentNo(studentNo) {
  const student = students.find((s) => s.studentNo === studentNo);
  return resolveAsync(student ? toPublicStudent(student) : undefined);
}

/**
 * Resolves which group a student belongs to.
 * Future Sheets: look up the student row and read the Group Code column.
 * All private dashboards must use this group — never another team's code.
 */
export async function getStudentGroupCode(studentNo) {
  const student = await getStudentByStudentNo(studentNo);
  return resolveAsync(student?.groupCode);
}

/**
 * Mock authentication: Student Number + 4-digit PIN.
 * Never returns the PIN. Replace this body with a Sheets/Apps Script
 * check when the database is connected — do not authenticate in the UI.
 */
export async function authenticateStudent(studentNo, pin) {
  const match = students.find(
    (s) => s.studentNo === studentNo.trim() && s.pin === pin.trim()
  );
  return resolveAsync(match ? toPublicStudent(match) : null);
}

/**
 * Course deliverables for ONE group: Submitted or Missing only.
 * This is what the student dashboard should show after login.
 */
export async function getGroupDeliverables(groupCode) {
  const submittedMap = groupSubmissions[groupCode] || {};
  const rows = deliverableCatalog.map((item) =>
    mergeGroupDeliverable(item, submittedMap[item.id])
  );
  return resolveAsync(rows);
}

/**
 * Share of group deliverables that are Submitted (0–100).
 */
export async function getGroupSubmissionProgress(groupCode) {
  const rows = await getGroupDeliverables(groupCode);
  if (!rows.length) return resolveAsync(0);
  const submitted = rows.filter((r) => r.status === "Submitted").length;
  return resolveAsync(Math.round((submitted / rows.length) * 100));
}

/**
 * Requirement rows for ONE student (legacy SDLC list).
 * Prefer getGroupDeliverables for the student dashboard.
 */
export async function getStudentRequirements(studentNo) {
  const rows = studentRequirements.filter((r) => r.studentNo === studentNo);
  const ordered = requirementDefs.map((def) =>
    rows.find((r) => r.requirement === def.key)
  );
  return resolveAsync(ordered);
}

export async function getStudentOverallProgress(studentNo) {
  const rows = await getStudentRequirements(studentNo);
  if (!rows.length) return resolveAsync(0);
  const submitted = rows.filter((r) => r.status === "Submitted").length;
  return resolveAsync(Math.round((submitted / rows.length) * 100));
}

/**
 * Public member count helpers. Names are intentionally not attached to
 * All Projects cards. Detail UIs should not list other students' profiles.
 */
export async function getProjectMembers(groupCode) {
  const members = students
    .filter((s) => s.groupCode === groupCode)
    .map(({ studentNo, name }) => ({ studentNo, name }));
  return resolveAsync(members);
}

export async function getProjectMemberCount(groupCode) {
  const members = await getProjectMembers(groupCode);
  return resolveAsync(members.length);
}

/**
 * Group-level overall progress from deliverable submissions — not grades.
 */
export async function getProjectOverallProgress(groupCode) {
  return getGroupSubmissionProgress(groupCode);
}

/**
 * Team-level requirement overview (Submitted / Missing only).
 * Used only for the logged-in student's own group.
 */
export async function getProjectRequirementsOverview(groupCode) {
  const members = await getProjectMembers(groupCode);
  const allRows = await Promise.all(
    members.map((m) => getStudentRequirements(m.studentNo))
  );

  return resolveAsync(
    requirementDefs.map((def, i) => {
      const submittedCount = allRows.filter(
        (rows) => rows[i]?.status === "Submitted"
      ).length;
      const allSubmitted =
        members.length > 0 && submittedCount === members.length;
      const status = allSubmitted ? "Submitted" : "Missing";
      const submittedDate = allSubmitted
        ? allRows[0]?.[i]?.submittedDate ?? null
        : null;

      return {
        key: def.key,
        label: def.label,
        dueDate: def.dueDate,
        progress: allSubmitted ? 100 : 0,
        status,
        submittedDate,
      };
    })
  );
}

export async function getProjectByGroupCode(groupCode) {
  const project = projects.find((p) => p.groupCode === groupCode);
  return resolveAsync(project ? { ...project } : undefined);
}

/**
 * All Projects grid: title, description, member count, overall progress.
 * No member names, no per-requirement status.
 */
export async function getAllProjects() {
  const enriched = await Promise.all(
    projects.map(async (project) => {
      const memberCount = await getProjectMemberCount(project.groupCode);
      const progress = await getProjectOverallProgress(project.groupCode);
      return {
        groupCode: project.groupCode,
        title: project.title,
        description: project.description,
        memberCount,
        progress,
      };
    })
  );
  return resolveAsync(enriched);
}
