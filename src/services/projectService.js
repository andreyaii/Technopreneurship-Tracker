/**
 * projectService.js
 * ------------------------------------------------------------------
 * Data-access layer. Pages and components ONLY talk to this file —
 * never to src/data/mockData.js or mockDeliverables.js directly.
 *
 * All live data (students, advisers, comments, ratings) is fetched from
 * Google Apps Script via the action-based postAction() helper in api.js.
 * Mock data is only kept for the legacy Projects/AllProjects view that
 * has not been connected to a real Sheets source yet.
 *
 *   React UI  →  projectService.js  →  Apps Script  →  Google Sheets
 * ------------------------------------------------------------------
 */

import {
  studentRequirements,
  requirementDefs,
} from "../data/mockData";

import { postAction } from "./api";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const resolveAsync = (value) => Promise.resolve(value);

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Authenticate a student via Google Sheets.
 * Returns a safe student object on success, null on failure.
 * The PIN is never returned to the caller.
 */
export async function authenticateStudent(studentNo, pin) {
  try {
    const data = await postAction({
      action: "loginStudent",
      studentNo: String(studentNo || "").trim(),
      pin: String(pin ?? ""),
    });

    if (!data.success || !data.student) {
      const error = new Error(data.message || "Invalid student number or PIN.");
      error.apiMessage = data.message;
      throw error;
    }

    const s = data.student;

    return {
      role: "student",
      studentNo: String(s.studentNo || ""),
      name: String(s.name || ""),
      section: String(s.section || ""),
      groupCode: String(s.groupCode || ""),
      mentor: String(s.mentor || ""),
      program: String(s.program || ""),
      memberNo: s.memberNo !== undefined ? Number(s.memberNo) : null,
      deliverables: s.deliverables || [],
      progress: s.progress || 0,
    };
  } catch (err) {
    console.error("Student login error:", err);
    throw err;
  }
}

/**
 * Authenticate an adviser via Google Sheets (Advisers sheet).
 * Returns a safe adviser object on success, null on failure.
 * The PIN is never returned to the caller.
 */
export async function authenticateAdviser(adviserNo, pin) {
  try {
    const data = await postAction({
      action: "loginAdviser",
      adviserNo: String(adviserNo || "").trim(),
      pin: String(pin ?? ""),
    });

    if (!data.success || !data.adviser) {
      const error = new Error(data.message || "Invalid Adviser ID or PIN.");
      error.apiMessage = data.message;
      throw error;
    }

    const a = data.adviser;

    return {
      role: "adviser",
      adviserNo: String(a.adviserNo || ""),
      name: String(a.name || ""),
      roleName: String(a.roleName || "adviser"),
    };
  } catch (err) {
    console.error("Adviser login error:", err);
    throw err;
  }
}

/**
 * Look up a single student by student number.
 * Uses Google Sheets via postAction("getStudentByStudentNo").
 */
export async function getStudentByStudentNo(studentNo) {
  if (!studentNo) return null;

  try {
    const data = await postAction({
      action: "getStudentByStudentNo",
      studentNo: studentNo.trim(),
    });

    if (!data.success || (!data.data && !data.student)) {
      return null;
    }

    const s = data.data || data.student;

    return {
      role: "student",
      studentNo: String(s.studentNo || ""),
      name: String(s.name || ""),
      section: String(s.section || ""),
      groupCode: String(s.groupCode || ""),
      mentor: String(s.mentor || s.instructor || ""),
      program: String(s.program || ""),
      memberNo: s.memberNo !== undefined && s.memberNo !== null ? Number(s.memberNo) : null,
      deliverables: s.deliverables || [],
      progress: s.progress || 0,
    };
  } catch (err) {
    console.error("getStudentByStudentNo error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Student / group data
// ---------------------------------------------------------------------------

export async function getStudentGroupCode(studentNo) {
  const student = await getStudentByStudentNo(studentNo);
  return resolveAsync(student?.groupCode);
}

export async function getGroupDeliverables(groupCodeInput) {
  try {
    const groupCode =
      typeof groupCodeInput === "object"
        ? groupCodeInput?.groupCode
        : groupCodeInput;

    if (!groupCode) return [];

    const data = await postAction({
      action: "getGroupDeliverables",
      groupCode,
    });

    if (!data.success || !Array.isArray(data.data)) {
      console.error("getGroupDeliverables failed:", data?.message);
      return [];
    }

    return data.data;
  } catch (err) {
    console.error("getGroupDeliverables error:", err);
    return [];
  }
}

export async function getGroupSubmissionProgress(studentOrGroupCode) {
  const groupCode =
    typeof studentOrGroupCode === "object"
      ? studentOrGroupCode?.groupCode
      : studentOrGroupCode;

  if (!groupCode) return 0;

  try {
    const data = await postAction({
      action: "getGroupProgress",
      groupCode,
    });

    if (data.success && typeof data.progress === "number") {
      return data.progress;
    }
  } catch (err) {
    console.error("getGroupSubmissionProgress API error:", err);
  }

  const rows = await getGroupDeliverables(groupCode);

  if (!rows.length) return 0;

  const submitted = rows.filter(
    (r) => r.status === "Submitted" || r.isSubmitted === true
  ).length;
  return Math.round((submitted / rows.length) * 100);
}

/** Requirement rows for ONE student (legacy SDLC list). */
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

// ---------------------------------------------------------------------------
// Group members — from Google Sheets via Apps Script
// ---------------------------------------------------------------------------

/**
 * Returns an array of members for the given group.
 * Shape: [{ studentNo, name, memberNo }]
 */
export async function getGroupMembers(groupCode) {
  try {
    const data = await postAction({ action: "getGroupMembers", groupCode });
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error("getGroupMembers error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Project (mock-backed, existing behaviour preserved)
// ---------------------------------------------------------------------------

export async function getProjectMembers(groupCode) {
  try {
    const data = await postAction({
      action: "getGroupMembers",
      groupCode,
    });

    if (!data.success || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((member) => ({
      studentNo: member.studentNo,
      name: member.name,
    }));
  } catch (err) {
    console.error("getProjectMembers error:", err);
    return [];
  }
}

export async function getProjectMemberCount(groupCode) {
  const members = await getProjectMembers(groupCode);
  return resolveAsync(members.length);
}

export async function getProjectOverallProgress(groupCode) {
  try {
    const data = await postAction({
      action: "getGroupProgress",
      groupCode,
    });

    if (!data.success) {
      console.error("getGroupProgress failed:", data.message);
      return 0;
    }

    return Number(data.progress || 0);
  } catch (err) {
    console.error("getProjectOverallProgress error:", err);
    return 0;
  }
}

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
      const status = allSubmitted ? "Submitted" : "Not Available";
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
  try {
    const data = await postAction({
      action: "getGroups",
    });

    if (!data.success || !Array.isArray(data.data)) {
      return undefined;
    }

    const project = data.data.find(
      (item) => item.groupCode === groupCode
    );

    return project || undefined;
  } catch (err) {
    console.error("getProjectByGroupCode error:", err);
    return undefined;
  }
}

/**
 * getProjectNotes is kept for backward compatibility.
 * Returns an empty notes object — the Dashboard now uses the
 * real comment/rating service functions below.
 */
export async function getProjectNotes(/* groupCode */) {
  return resolveAsync({ studentComment: "", adviserFeedback: "" });
}

/** @deprecated Use getGroupComments/addGroupComment instead. */
export async function saveAdviserFeedback(/* groupCode, adviserFeedback */) {
  return resolveAsync({ studentComment: "", adviserFeedback: "" });
}

/** @deprecated */
export async function saveStudentComment(groupCode) {
  return getProjectNotes(groupCode);
}

export async function getAllProjects() {
  try {
    const data = await postAction({
      action: "getGroups",
    });

    console.log("getGroups response:", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to load groups.");
    }

    const groups = Array.isArray(data.data) ? data.data : [];
    return groups
      .filter(
        (group) =>
          typeof group?.groupCode === "string" && group.groupCode.trim().length > 0
      )
      .map((group) => {
        const groupCode = group.groupCode.trim();
        const title =
          typeof group.title === "string" && group.title.trim()
            ? group.title.trim()
            : "None";
        const description =
          typeof group.description === "string" && group.description.trim()
            ? group.description.trim()
            : `${groupCode}`;

        return { ...group, groupCode, title, description };
      });
  } catch (err) {
    console.error("getAllProjects error:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Comments — Group Comments (GroupComments sheet)
// ---------------------------------------------------------------------------

/**
 * Fetch all comments for a group.
 * Returns: [{ group, adviser, comment, timestamp }]
 */
export async function getGroupComments(groupCode) {
  try {
    const data = await postAction({ action: "getGroupComments", groupCode });
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error("getGroupComments error:", err);
    return [];
  }
}

/**
 * Add a group comment.
 * @param {string} groupCode
 * @param {string} adviserName - comes from AuthContext, never manually entered
 * @param {string} comment
 */
export async function addGroupComment(groupCode, adviserName, comment, adviserId) {
  const trimmed = comment.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");
  const data = await postAction({
    action: "addGroupComment",
    groupCode,
    adviser: adviserName,
    adviserId: adviserId || adviserName,
    comment: trimmed,
  });
  if (!data.success) {
    throw new Error(data.message || "Failed to save group comment.");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Comments — Individual Comments (IndividualComments sheet)
// ---------------------------------------------------------------------------

/**
 * Fetch individual comments for ONE specific student.
 * The Apps Script filters by studentNo server-side.
 * Students NEVER see another student's individual comments.
 *
 * @param {string} studentNo
 */
export async function getIndividualComments(studentNo) {
  try {
    const data = await postAction({ action: "getIndividualComments", studentNo });
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error("getIndividualComments error:", err);
    return [];
  }
}

/**
 * Add an individual comment.
 * @param {{ studentNo, name, groupCode }} student - from selected member record
 * @param {string} adviserName - from AuthContext
 * @param {string} comment
 * @param {string} [adviserId] - optional adviser account ID
 */
export async function addIndividualComment(student, adviserName, comment, adviserId) {
  const trimmed = comment.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");
  const data = await postAction({
    action: "addIndividualComment",
    studentNo: student.studentNo,
    group: student.groupCode,
    studentName: student.name,
    adviser: adviserName,
    adviserId: adviserId || adviserName,
    comment: trimmed,
  });
  if (!data.success) {
    throw new Error(data.message || "Failed to save individual comment.");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Ratings (Ratings sheet)
// ---------------------------------------------------------------------------

/**
 * Fetch ratings for a group and/or individual student.
 * Adviser can call with groupCode only; student should provide both.
 *
 * Returns: { groupRating: { rating, adviser, timestamp } | null,
 *            individualRating: { rating, adviser, timestamp } | null }
 */
export async function getRatings(groupCode, studentNo) {
  try {
    const data = await postAction({
      action: "getRatings",
      groupCode,
      studentNo: studentNo || "",
    });
    if (data.success) {
      return data.data || { groupRating: null, individualRating: null };
    }
    return { groupRating: null, individualRating: null };
  } catch (err) {
    console.error("getRatings error:", err);
    return { groupRating: null, individualRating: null };
  }
}

/**
 * Add a rating.
 * @param {"Group"|"Individual"} targetType
 * @param {string} groupCode
 * @param {{ studentNo, name } | null} studentRecord - required for Individual
 * @param {string} adviserName - from AuthContext
 * @param {number} rating - integer 1-5
 * @param {string} [adviserId] - optional adviser account ID
 */
export async function addRating(targetType, groupCode, studentRecord, adviserName, rating, adviserId) {
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }
  const data = await postAction({
    action: "addRating",
    targetType,
    groupCode,
    studentNo: studentRecord?.studentNo || "",
    studentName: studentRecord?.name || "",
    adviser: adviserName,
    adviserId: adviserId || adviserName,
    rating: ratingNum,
  });
  if (!data.success) {
    throw new Error(data.message || "Failed to save rating.");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Adviser Dashboard Statistics & Activity Completion Overview
// ---------------------------------------------------------------------------

/**
 * Fetches dashboard statistics and deliverable completion overview for advisers.
 *
 * 1. Checks backend `getAdviserDashboardStats` action first (if supported by deployed Apps Script).
 * 2. Falls back to composing the existing `getAllProjects`, `getGroupMembers`, and `getGroupDeliverables`
 *    API endpoints in parallel.
 *
 * The backend counts student and group rows within the requested sheet ranges
 * and counts deliverable columns J-T. The fallback retains the same group rows.
 *
 * Computes:
 *  - totalStudents: populated TEC_CSIT student rows
 *  - totalGroups: populated Groups sheet rows, including groups without titles
 *  - totalActivities: deliverable columns monitored in the tracker
 *  - overallCompletionRate: (completed required entries / total required entries) * 100
 *  - activities: list of activities sorted ascending by completion rate (lowest first)
 */
export async function getAdviserDashboardStats(providedProjects = null) {
  try {
    const response = await postAction(
      { action: "getAdviserDashboardStats" },
      0,
      12000
    );
    if (response.success && response.data) {
      return response.data;
    }
  } catch (err) {
    console.warn("Adviser dashboard stats endpoint unavailable; using fallback:", err);
  }

  // Use provided projects if available, otherwise fetch
  const projects = Array.isArray(providedProjects) && providedProjects.length > 0
    ? providedProjects
    : await getAllProjects();

  const validProjects = projects.filter(
    (p) =>
      typeof p?.groupCode === "string" &&
      p.groupCode.trim().length > 0 &&
      typeof p?.title === "string"
  );

  // Deduplicate project groups by groupCode
  const seenGroupCodes = new Set();
  const distinctProjects = [];
  for (const p of validProjects) {
    const code = p.groupCode.trim();
    if (!seenGroupCodes.has(code.toLowerCase())) {
      seenGroupCodes.add(code.toLowerCase());
      distinctProjects.push(p);
    }
  }

  if (distinctProjects.length === 0) {
    return {
      totalStudents: 0,
      totalGroups: 0,
      totalActivities: 0,
      overallCompletionRate: 0,
      completedEntries: 0,
      totalRequiredEntries: 0,
      activities: [],
    };
  }

  // Fetch a few groups at a time to limit Apps Script concurrency without
  // making one serial round trip for every pair of groups.
  const groupResults = [];
  const chunkSize = 6;
  for (let i = 0; i < distinctProjects.length; i += chunkSize) {
    const chunk = distinctProjects.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (project) => {
        const [members, deliverables] = await Promise.all([
          getGroupMembers(project.groupCode).catch(() => []),
          getGroupDeliverables(project.groupCode).catch(() => []),
        ]);
        return {
          project,
          members: Array.isArray(members) ? members : [],
          deliverables: Array.isArray(deliverables) ? deliverables : [],
        };
      })
    );
    groupResults.push(...chunkResults);
  }

  // Fetch total student count from the lightweight backend endpoint so it matches
  // the spreadsheet's STUDENT NO. column exactly (not just grouped students).
  let totalStudents = groupResults.reduce(
    (total, { members }) => total + members.length,
    0
  );
  try {
    const countResp = await postAction({ action: "getTotalStudents" }, 0, 8000);
    if (countResp.success && countResp.data && typeof countResp.data.totalStudents === "number") {
      totalStudents = countResp.data.totalStudents;
    }
  } catch (err) {
    console.warn("getTotalStudents fallback failed; using group member sum:", err);
  }

  // Aggregate activity deliverables across all groups
  const activityMap = new Map();
  let totalCompletedEntries = 0;
  let totalRequiredEntries = 0;

  groupResults.forEach(({ members, deliverables, project }) => {
    const groupMemberCount = members.length;
    deliverables.forEach((deliv) => {
      const title = String(deliv?.title || "").trim();
      if (!title) return;

      if (!activityMap.has(title)) {
        activityMap.set(title, {
          id: deliv.id || `act-${activityMap.size + 1}`,
          title: title,
          type: deliv.type || "document",
          completedCount: 0,
          totalRequired: 0,
          groupBreakdown: [],
        });
      }

      const entry = activityMap.get(title);
      const completedInGroup = Number(deliv.submittedCount) || 0;
      const requiredInGroup =
        groupMemberCount > 0
          ? groupMemberCount
          : deliv.totalMembers !== undefined &&
            deliv.totalMembers !== null &&
            deliv.totalMembers > 0
          ? Number(deliv.totalMembers)
          : 0;

      entry.completedCount += completedInGroup;
      entry.totalRequired += requiredInGroup;
      entry.groupBreakdown.push({
        groupCode: project.groupCode,
        groupTitle: project.title,
        completed: completedInGroup,
        required: requiredInGroup,
        status:
          deliv.status ||
          (completedInGroup >= requiredInGroup && requiredInGroup > 0
            ? "Submitted"
            : "Not Available"),
      });

      totalCompletedEntries += completedInGroup;
      totalRequiredEntries += requiredInGroup;
    });
  });

  // Transform and sort activities from lowest completion rate to highest.
  // Use totalStudents as the denominator so "out of" matches the Total Students card.
  const activities = Array.from(activityMap.values()).map((act) => {
    const rate =
      totalStudents > 0
        ? Math.round((act.completedCount / totalStudents) * 1000) / 10
        : 0;
    return {
      ...act,
      totalRequired: totalStudents,
      completionRate: rate,
    };
  });

  activities.sort((a, b) => a.completionRate - b.completionRate);

  // Recompute totals using the consistent totalStudents denominator
  const correctedTotalRequired = totalStudents * activities.length;
  const overallRate =
    correctedTotalRequired > 0
      ? Math.round((totalCompletedEntries / correctedTotalRequired) * 1000) / 10
      : 0;

  return {
    totalStudents,
    totalGroups: distinctProjects.length,
    totalActivities: activities.length,
    overallCompletionRate: overallRate,
    completedEntries: totalCompletedEntries,
    totalRequiredEntries: correctedTotalRequired,
    activities,
  };
}
