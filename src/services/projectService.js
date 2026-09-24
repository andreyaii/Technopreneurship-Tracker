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

const API_URL =
  "https://script.google.com/macros/s/AKfycbw3-b781_EiXjAvJBsU6Knh5y_S4ABuaiLW2U0nKEolAm-y8YQ2m6qtafm-wHviIDAa/exec";

const resolveAsync = (value) => Promise.resolve(value);
const adviser = { role: "adviser", name: "Adviser Demo", adviserNo: "adviser" };
const projectNotes = {
  "2526-sem2-it411-01": {
    studentComment: "We are validating the first sensor readings with two farms.",
    adviserFeedback: "Good momentum. Please include the validation results in the next update.",
  },
};


function toPublicStudent(student) {
  if (!student) return undefined;
  const { pin: _omit, ...safeStudent } = student;
  return { ...safeStudent, role: "student", mentor: student.mentor || student.instructor };
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
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        studentNo: studentNo.trim(),
        pin: pin.trim(),
      }),
    });

    const data = await response.json();

    if (!data.success || !data.student) {
      return null;
    }

    const apiStudent = data.student;

    return {
      role: "student",

      // Basic student information
      studentNo: String(apiStudent.studentNo || ""),
      name: String(apiStudent.name || ""),
      section: String(apiStudent.section || ""),
      groupCode: String(apiStudent.groupCode || ""),
      mentor: String(apiStudent.mentor || ""),
      program: String(apiStudent.program || ""),

      // Tracker data from Google Sheets
      deliverables: apiStudent.deliverables || [],
      progress: apiStudent.progress || 0,
    };
  } catch (error) {
    console.error("Student login error:", error);
    return null;
  }
}

export async function authenticateAdviser(adviserNo, pin) {
  return resolveAsync(adviserNo.trim().toLowerCase() === "adviser" && pin.trim() === "1234" ? adviser : null);
}

/**
 * Course deliverables for ONE group: Submitted or Missing only.
 * This is what the student dashboard should show after login.
 */
export async function getGroupDeliverables(student) {
  if (!student) {
    return [];
  }

  return resolveAsync(student.deliverables || []);
}

/**
 * Share of group deliverables that are Submitted (0–100).
 */
export async function getGroupSubmissionProgress(student) {
  const rows = await getGroupDeliverables(student);

  if (!rows.length) {
    return 0;
  }

  const submitted = rows.filter(
    (row) => row.status === "Submitted"
  ).length;

  return Math.round(
    (submitted / rows.length) * 100
  );
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
  return resolveAsync(project ? { ...project, ...(projectNotes[groupCode] || {}) } : undefined);
}

export async function getProjectNotes(groupCode) {
  return resolveAsync({ studentComment: "", adviserFeedback: "", ...(projectNotes[groupCode] || {}) });
}

export async function saveStudentComment(groupCode, studentComment) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  projectNotes[groupCode] = { ...(projectNotes[groupCode] || {}), studentComment: studentComment.trim() };
  return getProjectNotes(groupCode);
}

export async function saveAdviserFeedback(groupCode, adviserFeedback) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  projectNotes[groupCode] = { ...(projectNotes[groupCode] || {}), adviserFeedback: adviserFeedback.trim() };
  return getProjectNotes(groupCode);
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
