/**
 * ============================================================================
 * Technopreneurship Tracker - Google Apps Script Web App (Backend)
 * ============================================================================
 * Database Google Sheets:
 *  1. "TEC_CSIT"           - Student credentials, group, mentor, deliverables
 *  2. "Advisers"           - Adviser credentials (AdviserID, Name, PIN, Role)
 *  3. "GroupComments"      - Team-wide comments (Group, Adviser, Comment, Timestamp)
 *  4. "IndividualComments" - Student-private comments (StudentNo., Group, Student Name, Adviser, Comment, Timestamp)
 *  5. "Ratings"            - 1-5 ratings (TargetType, Group, StudentNo., Student Name, Adviser, Rating, Timestamp)
 *  6. "REF"                - Course reference data
 * ============================================================================
 */

const SHEET_NAMES = {
  STUDENTS: "TEC_CSIT",
  GROUPS: "Groups",
  ADVISERS: "Advisers",
  GROUP_COMMENTS: "GroupComments",
  INDIVIDUAL_COMMENTS: "IndividualComments",
  RATINGS: "Ratings",
  REF: "REF",
};

// Row 539 in TEC_CSIT sheet contains OPEN/CLOSED availability flags for deliverables
const AVAILABILITY_ROW_INDEX = 539;
const STUDENT_METADATA_COLUMN_COUNT = 9;
const ADVISER_STATS_COLUMN_COUNT = 20;

const STUDENT_METADATA_HEADERS = new Set([
  "NO",
  "NAME OF STUDENT",
  "STUDENT NO.",
  "PROGRAM",
  "SEC",
  "GROUP",
  "MEMBER #",
  "MENTOR",
  "PIN",
]);

function getDeliverableColumns(headerRow) {
  return headerRow.reduce((columns, header, index) => {
    const title = String(header || "").trim();
    const normalizedTitle = title.toUpperCase();

    if (!title || STUDENT_METADATA_HEADERS.has(normalizedTitle)) {
      return columns;
    }

    const type = /^Q\d|QUIZ/.test(normalizedTitle)
      ? "quiz"
      : /\bPITCH\b/.test(normalizedTitle)
        ? "pitch"
        : "document";

    columns.push({
      id: `deliverable-${index}`,
      index: index,
      title: title,
      type: type,
    });
    return columns;
  }, []);
}

function isNotAvailableValue(value) {
  return value === null || value === undefined ||
    (typeof value === "string" && (!value.trim() || value.trim().toUpperCase() === "#N/A"));
}

/**
 * Handle HTTP POST requests from the Technopreneurship Tracker frontend.
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const body = JSON.parse(rawData);

    // Support both action-based payload and legacy { studentNo, pin } payload
    const action = body.action || (body.studentNo && body.pin ? "loginStudent" : "");

    switch (action) {
      case "loginStudent":
        return jsonResponse(handleLoginStudent(body));

      case "loginAdviser":
        return jsonResponse(handleLoginAdviser(body));

      case "getStudent":
      case "getStudentByStudentNo":
        return jsonResponse(handleGetStudent(body));

      case "getGroupMembers":
        return jsonResponse(handleGetGroupMembers(body));

      case "getGroupProgress":
         return jsonResponse(handleGetGroupProgress(body));

    case "getGroupDeliverables":
        return jsonResponse(handleGetGroupDeliverables(body));

      case "getGroups":
        return jsonResponse(handleGetGroups(body));

      case "getGroupComments":
        return jsonResponse(handleGetGroupComments(body));

      case "getIndividualComments":
        return jsonResponse(handleGetIndividualComments(body));

      case "addGroupComment":
        return jsonResponse(handleAddGroupComment(body));

      case "addIndividualComment":
        return jsonResponse(handleAddIndividualComment(body));

      case "getRatings":
        return jsonResponse(handleGetRatings(body));

      case "addRating":
        return jsonResponse(handleAddRating(body));

      // ── ADDED: adviser dashboard stats ──────────────────────────
      case "getAdviserStats":
      case "getAdviserDashboardStats":
        return jsonResponse(handleGetAdviserDashboardStats());

      case "getTotalStudents":
        return jsonResponse(handleGetTotalStudents());
      // ────────────────────────────────────────────────────────────

      default:
        return jsonResponse({
          success: false,
          message: "Unknown or missing action: " + action,
        });
    }
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Server error: " + err.toString(),
    });
  }
}

/**
 * Helper to build JSON output with proper MIME type.
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Helper to get or create sheet by name.
 */
function getOrCreateSheet(sheetName, defaultHeaders) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
    }
  }
  return sheet;
}

function getStudentMetadataData(sheet) {
  const lastRow = sheet.getLastRow();
  return lastRow > 0
    ? sheet.getRange(1, 1, lastRow, STUDENT_METADATA_COLUMN_COUNT).getValues()
    : [[]];
}

function getAdviserSheetData() {
  const sheet = getOrCreateSheet(SHEET_NAMES.ADVISERS, ["AdviserID", "Name", "PIN", "Role"]);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    const guestAccount = ["guest", "Guest Adviser", "1234", "guest"];
    sheet.appendRow(guestAccount);
    data.push(guestAccount);
  }

  return data;
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Action: loginStudent
 * Validates Student No. and PIN against "TEC_CSIT" sheet.
 * Preserves existing deliverable format and progress computation.
 * Never returns PIN.
 */
function handleLoginStudent(body) {
  const studentNo = String(body.studentNo || "").trim();
  const pin = String(body.pin || "").trim();

  if (!studentNo || !pin) {
    return { success: false, message: "Student number and PIN are required." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) {
    return { success: false, message: "Students sheet not found." };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return { success: false, message: "No student records found." };
  }

  const headers = data[0].map(h => String(h).trim().toUpperCase());
  const deliverableColumns = getDeliverableColumns(data[0]);
  const colIndex = {
    no: headers.indexOf("NO"),
    name: headers.indexOf("NAME OF STUDENT"),
    studentNo: headers.indexOf("STUDENT NO."),
    program: headers.indexOf("PROGRAM"),
    sec: headers.indexOf("SEC"),
    group: headers.indexOf("GROUP"),
    memberNo: headers.indexOf("MEMBER #"),
    mentor: headers.indexOf("MENTOR"),
    pin: headers.indexOf("PIN"),
  };

  if (colIndex.studentNo === -1 || colIndex.pin === -1) {
    return { success: false, message: "Required student columns missing in header." };
  }

  // Row 539 contains OPEN/CLOSED availability if present
  let availabilityMap = {};
  if (data.length >= AVAILABILITY_ROW_INDEX) {
    const availRow = data[AVAILABILITY_ROW_INDEX - 1];
    deliverableColumns.forEach(deliv => {
      availabilityMap[deliv.index] = String(availRow[deliv.index] || "").trim().toUpperCase();
    });
  }

  for (let r = 1; r < data.length; r++) {
    // Avoid checking metadata/availability rows at bottom
    if (r === AVAILABILITY_ROW_INDEX - 1) continue;

    const row = data[r];
    const rowStudentNo = String(row[colIndex.studentNo] || "").trim();
    const rowPin = String(row[colIndex.pin] || "").trim();

    if (rowStudentNo.toLowerCase() === studentNo.toLowerCase()) {
      if (rowPin !== pin) {
        return { success: false, message: "Invalid student number or PIN." };
      }

      // Build deliverables list
      const deliverables = [];
      let submittedCount = 0;
      let unavailableCount = 0;
      const ssTimezone = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || "GMT+8";

      deliverableColumns.forEach(deliv => {
        const colIdx = deliv.index;
        let isSubmitted = false;
        let submittedDate = null;
        const rawCell = row[colIdx];
        const isNotAvailable = isNotAvailableValue(rawCell);

        if (isNotAvailable) {
          unavailableCount++;
        } else if (colIdx !== -1) {
          if (rawCell !== null && rawCell !== undefined && rawCell !== "") {
            if (rawCell instanceof Date) {
              if (!isNaN(rawCell.getTime())) {
                isSubmitted = true;
                submittedDate = Utilities.formatDate(rawCell, ssTimezone, "MMM d, yyyy");
              }
            } else if (typeof rawCell === "string") {
              const strVal = rawCell.trim();
              if (strVal !== "") {
                isSubmitted = true;
                submittedDate = strVal;
              }
            } else {
              isSubmitted = true;
              submittedDate = String(rawCell);
            }
          }
        }

        if (isSubmitted) {
          submittedCount++;
        }

        // Row 539 controls availability separately from student submission
        const rawAvail = availabilityMap[deliv.index];
        const isAvailable = (rawAvail !== undefined && rawAvail !== "")
          ? rawAvail === "OPEN"
          : true;
        const availabilityStr = isAvailable ? "Open" : "Closed";

        deliverables.push({
          id: deliv.id,
          title: deliv.title,
          type: deliv.type,
          status: isSubmitted ? "Submitted" : "Not Available",
          isSubmitted: isSubmitted,
          submittedDate: submittedDate,
          availability: availabilityStr,
          dueDate: availabilityStr,
          daysLate: 0,
        });
      });

      const totalDeliverables = deliverables.length;
      const progress = totalDeliverables > 0
        ? Math.round((submittedCount / (submittedCount + unavailableCount)) * 100)
        : 0;

      return {
        success: true,
        student: {
          studentNo: rowStudentNo,
          name: String(row[colIndex.name] || "").trim(),
          program: colIndex.program !== -1 ? String(row[colIndex.program] || "").trim() : "",
          section: colIndex.sec !== -1 ? String(row[colIndex.sec] || "").trim() : "",
          groupCode: colIndex.group !== -1 ? String(row[colIndex.group] || "").trim() : "",
          memberNo: colIndex.memberNo !== -1 ? Number(row[colIndex.memberNo]) || null : null,
          mentor: colIndex.mentor !== -1 ? String(row[colIndex.mentor] || "").trim() : "",
          deliverables: deliverables,
          progress: progress,
        },
      };
    }
  }

  return { success: false, message: "Student record not found." };
}

/**
 * Action: loginAdviser
 * Validates Adviser credentials against "Advisers" sheet.
 * Supports default guest account (guest / 1234).
 * Never returns PIN.
 */
function handleLoginAdviser(body) {
  const adviserNo = String(body.adviserNo || "").trim();
  const pin = String(body.pin || "").trim();

  if (!adviserNo || !pin) {
    return { success: false, message: "Adviser ID and PIN are required." };
  }

  const refreshedData = getAdviserSheetData();
  const headers = refreshedData[0].map(h => String(h).trim().toUpperCase());
  const colIndex = {
    adviserId: headers.indexOf("ADVISERID"),
    name: headers.indexOf("NAME"),
    pin: headers.indexOf("PIN"),
    role: headers.indexOf("ROLE"),
  };

  for (let r = 1; r < refreshedData.length; r++) {
    const row = refreshedData[r];
    const rowId = String(row[colIndex.adviserId] || "").trim();
    const rowPin = String(row[colIndex.pin] || "").trim();

    if (rowId.toLowerCase() === adviserNo.toLowerCase()) {
      if (rowPin !== pin) {
        return { success: false, message: "Invalid Adviser ID or PIN." };
      }

      return {
        success: true,
        adviser: {
          role: "adviser",
          adviserNo: rowId,
          name: String(row[colIndex.name] || "").trim(),
          roleName: colIndex.role !== -1 ? String(row[colIndex.role] || "adviser").trim() : "adviser",
        },
      };
    }
  }

  return { success: false, message: "Adviser account not found." };
}

/**
 * Validates that an adviser identifier or name corresponds to an existing
 * record in the "Advisers" sheet.
 * Matches against either AdviserID (case-insensitive) or Name (case-insensitive).
 * Returns { valid: true, adviserId, name } or { valid: false, message }.
 */
function validateAdviserExists(identifier) {
  const idStr = String(identifier || "").trim().toLowerCase();
  if (!idStr) {
    return { valid: false, message: "Adviser identifier is required." };
  }

  const refreshedData = getAdviserSheetData();
  const headers = refreshedData[0].map(h => String(h).trim().toUpperCase());
  const colAdviserId = headers.indexOf("ADVISERID");
  const colName = headers.indexOf("NAME");

  for (let r = 1; r < refreshedData.length; r++) {
    const row = refreshedData[r];
    const rowId = colAdviserId !== -1 ? String(row[colAdviserId] || "").trim().toLowerCase() : "";
    const rowName = colName !== -1 ? String(row[colName] || "").trim().toLowerCase() : "";

    if (rowId === idStr || rowName === idStr) {
      return {
        valid: true,
        adviserId: colAdviserId !== -1 ? String(row[colAdviserId] || "").trim() : "",
        name: colName !== -1 ? String(row[colName] || "").trim() : "",
      };
    }
  }

  return { valid: false, message: "Unauthorized: Adviser account does not exist in Advisers sheet." };
}

/**
 * Action: getStudent (Session / lookup)
 * PRIVACY GUARD: Requires authentication (either valid student PIN or registered adviser).
 * Unauthenticated callers are rejected so student directory data cannot be scraped.
 */
function handleGetStudent(body) {
  const studentNo = String(body.studentNo || "").trim();
  const pin = String(body.pin || "").trim();
  const adviserInput = String(body.adviserId || body.adviser || "").trim();

  if (!studentNo) {
    return { success: false, message: "studentNo is required." };
  }

  // Require either student PIN or a verified adviser account
  const isAdviser = adviserInput ? validateAdviserExists(adviserInput).valid : false;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) return { success: false, message: "Students sheet not found." };

  const data = getStudentMetadataData(sheet);
  const headers = data[0].map(h => String(h).trim().toUpperCase());
  const colStudentNo = headers.indexOf("STUDENT NO.");
  const colPin = headers.indexOf("PIN");
  const colName = headers.indexOf("NAME OF STUDENT");
  const colGroup = headers.indexOf("GROUP");
  const colMentor = headers.indexOf("MENTOR");
  const colSec = headers.indexOf("SEC");
  const colProgram = headers.indexOf("PROGRAM");
  const colMember = headers.indexOf("MEMBER #");

  for (let r = 1; r < data.length; r++) {
    if (r === AVAILABILITY_ROW_INDEX - 1) continue;
    const row = data[r];
    const rowStudentNo = String(row[colStudentNo] || "").trim();
    const rowPin = String(row[colPin] || "").trim();

    if (rowStudentNo.toLowerCase() === studentNo.toLowerCase()) {
      if (!isAdviser && (!pin || pin !== rowPin)) {
        return { success: false, message: "Unauthorized: PIN or Adviser authentication required." };
      }

      return {
        success: true,
        data: {
          studentNo: rowStudentNo,
          name: String(row[colName] || "").trim(),
          groupCode: colGroup !== -1 ? String(row[colGroup] || "").trim() : "",
          mentor: colMentor !== -1 ? String(row[colMentor] || "").trim() : "",
          section: colSec !== -1 ? String(row[colSec] || "").trim() : "",
          program: colProgram !== -1 ? String(row[colProgram] || "").trim() : "",
          memberNo: colMember !== -1 ? Number(row[colMember]) || null : null,
        },
      };
    }
  }

  return { success: false, message: "Student not found." };
}

/**
 * Action: getGroupMembers
 * Returns list of students for a given groupCode.
 */
function handleGetGroupMembers(body) {
  const groupCode = String(body.groupCode || "").trim();
  if (!groupCode) return { success: false, message: "groupCode is required." };
  const normalizedGroupCode = groupCode.toLowerCase();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) return { success: true, data: [] };

  const data = getStudentMetadataData(sheet);
  const headers = data[0].map(h => String(h).trim().toUpperCase());
  const colGroup = headers.indexOf("GROUP");
  const colStudentNo = headers.indexOf("STUDENT NO.");
  const colName = headers.indexOf("NAME OF STUDENT");
  const colMember = headers.indexOf("MEMBER #");

  const members = [];
  for (let r = 1; r < data.length; r++) {
    if (r === AVAILABILITY_ROW_INDEX - 1) continue;
    const row = data[r];
    if (String(row[colGroup] || "").trim().toLowerCase() === normalizedGroupCode) {
      members.push({
        studentNo: String(row[colStudentNo] || "").trim(),
        name: String(row[colName] || "").trim(),
        memberNo: colMember !== -1 ? Number(row[colMember]) || null : null,
        groupCode: groupCode,
      });
    }
  }

  // Sort by member number ascending
  members.sort((a, b) => (a.memberNo || 999) - (b.memberNo || 999));

  return { success: true, data: members };
}

function handleGetGroupProgress(payload) {
  const groupCode = String(payload.groupCode || "").trim();
  const normalizedGroupCode = groupCode.toLowerCase();

  if (!groupCode) {
    return {
      success: false,
      message: "Group code is required.",
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);

  if (!sheet) {
    return {
      success: false,
      message: "Students sheet not found.",
    };
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return {
      success: true,
      progress: 0,
    };
  }

  const headers = data[0].map(h =>
    String(h).trim().toUpperCase()
  );
  const deliverableColumns = getDeliverableColumns(data[0]);

  const colGroup = headers.indexOf("GROUP");

  if (colGroup === -1) {
    return {
      success: false,
      message: "GROUP column not found.",
    };
  }

  let totalSubmissions = 0;
  let totalUnavailable = 0;
  let totalExpected = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];

    const rowGroup = String(row[colGroup] || "").trim();

    if (rowGroup.toLowerCase() !== normalizedGroupCode) {
      continue;
    }

    for (const deliverable of deliverableColumns) {
      totalExpected++;

      const rawValue = row[deliverable.index];

      if (isNotAvailableValue(rawValue)) {
        totalUnavailable++;
      } else {
        totalSubmissions++;
      }
    }
  }

  const progress =
    totalExpected > 0
      ? Math.round((totalSubmissions / (totalSubmissions + totalUnavailable)) * 100)
      : 0;

  return {
    success: true,
    progress: progress,
    submitted: totalSubmissions,
    notAvailable: totalUnavailable,
    total: totalExpected,
  };
}
/**
 * Action: getGroups
 * Returns all groups/projects from the "Groups" sheet.
 */
function handleGetGroups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.GROUPS);

  if (!sheet) {
    return {
      success: false,
      message: "Groups sheet not found.",
    };
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return {
      success: true,
      data: [],
    };
  }

  const headers = data[0].map(h => String(h).trim().toUpperCase());

  const colGroup = headers.indexOf("GROUP");
  const colLeaderNo = headers.indexOf("LEADER NO");
  const colLeaderName = headers.indexOf("LEADER NAME");
  const colProjectTitle = headers.indexOf("PROJECT TITLE");
  const colProjectDescription = headers.indexOf("PROJECT DESCRIPTION");

  const groups = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];

    const groupCode = colGroup !== -1
      ? String(row[colGroup] || "").trim()
      : "";

    // Ignore completely empty rows
    if (!groupCode) continue;

    groups.push({
      groupCode: groupCode,
      leaderNo: colLeaderNo !== -1
        ? String(row[colLeaderNo] || "").trim()
        : "",
      leaderName: colLeaderName !== -1
        ? String(row[colLeaderName] || "").trim()
        : "",
      title: colProjectTitle !== -1
        ? String(row[colProjectTitle] || "").trim()
        : "",
      description: colProjectDescription !== -1
        ? String(row[colProjectDescription] || "").trim()
        : "",
    });
  }

  return {
    success: true,
    data: groups,
  };
}
/**
 * Action: getGroupComments
 * Returns all group comments for a groupCode, newest first.
 */
function handleGetGroupComments(body) {
  const groupCode = String(body.groupCode || "").trim();
  if (!groupCode) return { success: false, message: "groupCode is required." };
  const normalizedGroupCode = groupCode.toLowerCase();

  const sheet = getOrCreateSheet(SHEET_NAMES.GROUP_COMMENTS, [
    "Group", "Adviser", "Comment", "Timestamp"
  ]);
  const data = sheet.getDataRange().getValues();
  const comments = [];

  for (let r = data.length - 1; r > 0; r--) {
    const row = data[r];
    const rowGroup = String(row[0] || "").trim();
    if (rowGroup.toLowerCase() === normalizedGroupCode) {
      comments.push({
        group: rowGroup,
        adviser: String(row[1] || "").trim(),
        comment: String(row[2] || "").trim(),
        timestamp: row[3] instanceof Date ? row[3].toISOString() : String(row[3] || ""),
      });
    }
  }

  return { success: true, data: comments };
}

/**
 * Action: addGroupComment
 * Appends a comment for the whole group.
 * VALIDATION: Confirms the supplied adviser exists in the Advisers sheet.
 */
function handleAddGroupComment(body) {
  const groupCode = String(body.groupCode || "").trim();
  const adviserInput = String(body.adviserId || body.adviser || "").trim();
  const comment = String(body.comment || "").trim();

  if (!groupCode || !comment) {
    return { success: false, message: "Group code and comment are required." };
  }

  // Validate adviser exists in Advisers sheet
  const adviserCheck = validateAdviserExists(adviserInput);
  if (!adviserCheck.valid) {
    return { success: false, message: adviserCheck.message };
  }

  const sheet = getOrCreateSheet(SHEET_NAMES.GROUP_COMMENTS, [
    "Group", "Adviser", "Comment", "Timestamp"
  ]);
  const timestamp = new Date();
  const adviserDisplayName = adviserCheck.name || adviserInput;

  sheet.appendRow([groupCode, adviserDisplayName, comment, timestamp]);

  return {
    success: true,
    data: {
      group: groupCode,
      adviser: adviserDisplayName,
      comment: comment,
      timestamp: timestamp.toISOString(),
    },
  };
}

/**
 * Action: getIndividualComments
 * Returns comments strictly for the requested studentNo.
 * PRIVACY GUARANTEE: Filtered server-side so other students' comments are never returned.
 */
function handleGetIndividualComments(body) {
  const studentNo = String(body.studentNo || "").trim();
  if (!studentNo) return { success: false, message: "studentNo is required." };
  const normalizedStudentNo = studentNo.toLowerCase();

  const sheet = getOrCreateSheet(SHEET_NAMES.INDIVIDUAL_COMMENTS, [
    "StudentNo.", "Group", "Student Name", "Adviser", "Comment", "Timestamp"
  ]);
  const data = sheet.getDataRange().getValues();
  const comments = [];

  for (let r = data.length - 1; r > 0; r--) {
    const row = data[r];
    const rowStudentNo = String(row[0] || "").trim();
    if (rowStudentNo.toLowerCase() === normalizedStudentNo) {
      comments.push({
        studentNo: rowStudentNo,
        group: String(row[1] || "").trim(),
        studentName: String(row[2] || "").trim(),
        adviser: String(row[3] || "").trim(),
        comment: String(row[4] || "").trim(),
        timestamp: row[5] instanceof Date ? row[5].toISOString() : String(row[5] || ""),
      });
    }
  }

  return { success: true, data: comments };
}

/**
 * Action: addIndividualComment
 * Appends an individual student comment.
 * VALIDATION: Confirms the supplied adviser exists in the Advisers sheet.
 */
function handleAddIndividualComment(body) {
  const studentNo = String(body.studentNo || "").trim();
  const group = String(body.group || "").trim();
  const studentName = String(body.studentName || "").trim();
  const adviserInput = String(body.adviserId || body.adviser || "").trim();
  const comment = String(body.comment || "").trim();

  if (!studentNo || !comment) {
    return { success: false, message: "Student number and comment are required." };
  }

  // Validate adviser exists in Advisers sheet
  const adviserCheck = validateAdviserExists(adviserInput);
  if (!adviserCheck.valid) {
    return { success: false, message: adviserCheck.message };
  }

  const sheet = getOrCreateSheet(SHEET_NAMES.INDIVIDUAL_COMMENTS, [
    "StudentNo.", "Group", "Student Name", "Adviser", "Comment", "Timestamp"
  ]);
  const timestamp = new Date();
  const adviserDisplayName = adviserCheck.name || adviserInput;

  sheet.appendRow([studentNo, group, studentName, adviserDisplayName, comment, timestamp]);

  return {
    success: true,
    data: {
      studentNo: studentNo,
      group: group,
      studentName: studentName,
      adviser: adviserDisplayName,
      comment: comment,
      timestamp: timestamp.toISOString(),
    },
  };
}

/**
 * Action: getRatings
 * Returns the latest group rating and (if studentNo provided) the student's individual rating.
 */
function handleGetRatings(body) {
  const groupCode = String(body.groupCode || "").trim();
  const studentNo = String(body.studentNo || "").trim();
  const normalizedGroupCode = groupCode.toLowerCase();
  const normalizedStudentNo = studentNo.toLowerCase();

  const sheet = getOrCreateSheet(SHEET_NAMES.RATINGS, [
    "TargetType", "Group", "StudentNo.", "Student Name", "Adviser", "Rating", "Timestamp"
  ]);
  const data = sheet.getDataRange().getValues();

  let latestGroupRating = null;
  let latestIndividualRating = null;

  for (let r = data.length - 1; r > 0; r--) {
    const row = data[r];
    const targetType = String(row[0] || "").trim().toLowerCase();
    if (
      latestGroupRating === null &&
      groupCode &&
      targetType === "group" &&
      String(row[1] || "").trim().toLowerCase() === normalizedGroupCode
    ) {
      latestGroupRating = {
        rating: Number(row[5]) || 0,
        adviser: String(row[4] || "").trim(),
        timestamp: row[6] instanceof Date ? row[6].toISOString() : String(row[6] || ""),
      };
    }

    if (
      latestIndividualRating === null &&
      studentNo &&
      targetType === "individual" &&
      String(row[2] || "").trim().toLowerCase() === normalizedStudentNo
    ) {
      latestIndividualRating = {
        rating: Number(row[5]) || 0,
        adviser: String(row[4] || "").trim(),
        timestamp: row[6] instanceof Date ? row[6].toISOString() : String(row[6] || ""),
      };
    }

    if (latestGroupRating !== null && latestIndividualRating !== null) break;
  }

  return {
    success: true,
    data: {
      groupRating: latestGroupRating,
      individualRating: latestIndividualRating,
    },
  };
}

function handleGetGroupDeliverables(payload) {
  const groupCode = String(payload.groupCode || "").trim();

  if (!groupCode) {
    return {
      success: false,
      message: "Group code is required.",
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);

  if (!sheet) {
    return {
      success: false,
      message: "Students sheet not found.",
    };
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return {
      success: true,
      data: [],
    };
  }

  const headers = data[0].map((h) =>
    String(h).trim().toUpperCase()
  );
  const deliverableColumns = getDeliverableColumns(data[0]);

  const colGroup = headers.indexOf("GROUP");
  const colStudentNo = headers.indexOf("STUDENT NO.");

  if (colGroup === -1) {
    return {
      success: false,
      message: "GROUP column not found.",
    };
  }
  if (colStudentNo === -1) {
    return {
      success: false,
      message: "STUDENT NO. column not found.",
    };
  }

  const normalizedGroupCode = groupCode.toLowerCase();
  const groupRows = [];
  for (let r = 1; r < data.length; r++) {
    if (r === AVAILABILITY_ROW_INDEX - 1) continue;
    const row = data[r];
    const rowGroup = String(row[colGroup] || "").trim();
    const studentNo = String(row[colStudentNo] || "").trim();
    if (studentNo && rowGroup.toLowerCase() === normalizedGroupCode) {
      groupRows.push(row);
    }
  }

  if (groupRows.length === 0) {
    return {
      success: true,
      data: [],
    };
  }

  const timeZone = ss.getSpreadsheetTimeZone();
  const totalMembers = groupRows.length;

  const deliverables = deliverableColumns.map((deliverable) => {
    const colIndex = deliverable.index;
    let submittedCount = 0;
    let latestSubmittedDate = null;

    groupRows.forEach((row) => {
      const value = row[colIndex];

      if (isNotAvailableValue(value)) {
        return;
      }

      submittedCount++;

      if (value instanceof Date) {
        if (
          !latestSubmittedDate ||
          value > latestSubmittedDate
        ) {
          latestSubmittedDate = value;
        }
      }
    });

    const status = submittedCount === totalMembers
      ? "Submitted"
      : submittedCount > 0
        ? "In Progress"
        : "Not Available";

    let formattedSubmittedDate = null;

    if (status === "Submitted" && latestSubmittedDate) {
      formattedSubmittedDate = Utilities.formatDate(
        latestSubmittedDate,
        timeZone,
        "MMMM d, yyyy"
      );
    }

    return {
      id: deliverable.id,
      title: deliverable.title,
      type: deliverable.type,

      status: status,

      submittedCount: submittedCount,
      totalMembers: totalMembers,

      submittedDate: formattedSubmittedDate,

      daysLate: 0,
    };
  });

  return {
    success: true,
    data: deliverables,
  };
}
/**
 * Action: addRating
 * Appends a 1-5 rating record to "Ratings" sheet.
 * VALIDATION: Confirms the supplied adviser exists in the Advisers sheet.
 */
function handleAddRating(body) {
  const targetType = String(body.targetType || "Group").trim();
  const groupCode = String(body.groupCode || "").trim();
  const studentNo = String(body.studentNo || "").trim();
  const studentName = String(body.studentName || "").trim();
  const adviserInput = String(body.adviserId || body.adviser || "").trim();
  const rating = Number(body.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, message: "Rating must be an integer from 1 to 5." };
  }

  const isIndividual = targetType.toLowerCase() === "individual";
  if (isIndividual && !studentNo) {
    return { success: false, message: "Student number is required for individual ratings." };
  }

  // Validate adviser exists in Advisers sheet
  const adviserCheck = validateAdviserExists(adviserInput);
  if (!adviserCheck.valid) {
    return { success: false, message: adviserCheck.message };
  }

  const sheet = getOrCreateSheet(SHEET_NAMES.RATINGS, [
    "TargetType", "Group", "StudentNo.", "Student Name", "Adviser", "Rating", "Timestamp"
  ]);
  const timestamp = new Date();
  const adviserDisplayName = adviserCheck.name || adviserInput;

  sheet.appendRow([
    isIndividual ? "Individual" : "Group",
    groupCode,
    isIndividual ? studentNo : "",
    isIndividual ? studentName : "",
    adviserDisplayName,
    rating,
    timestamp,
  ]);

  return {
    success: true,
    data: {
      targetType: isIndividual ? "Individual" : "Group",
      groupCode: groupCode,
      studentNo: isIndividual ? studentNo : "",
      studentName: isIndividual ? studentName : "",
      adviser: adviserDisplayName,
      rating: rating,
      timestamp: timestamp.toISOString(),
    },
  };
}

// ============================================================================
// ADDED: Adviser Dashboard Stats
// ============================================================================

/**
 * Helper: findHeaderIndex
 * Returns the index of the first matching header from a list of candidates.
 */
function findHeaderIndex(headers, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const index = headers.indexOf(candidates[i]);
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Action: getTotalStudents
 * Lightweight action — counts only rows with a non-empty STUDENT NO. in TEC_CSIT,
 * excluding the availability flag row (row 539).
 * Used by the frontend fallback so Total Students always matches the spreadsheet.
 */
function handleGetTotalStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) {
    return { success: false, message: "Students sheet not found." };
  }

  const data = getStudentMetadataData(sheet);
  const headers = (data[0] || []).map(function (h) {
    return String(h || "").trim().toUpperCase();
  });
  const colStudentNo = headers.indexOf("STUDENT NO.");

  let count = 0;
  for (let r = 1; r < data.length; r++) {
    if (r === AVAILABILITY_ROW_INDEX - 1) continue; // skip availability flag row
    const sNo = colStudentNo !== -1 ? String(data[r][colStudentNo] || "").trim() : "";
    if (sNo) count++;
  }

  return { success: true, data: { totalStudents: count } };
}

/**
 * Action: getAdviserDashboardStats
 * Calculates overall statistics and deliverable completion rates directly from Google Sheets.
 *
 * Reads:
 *  - "Groups" sheet: all populated group rows
 *  - "TEC_CSIT" sheet: deliverable columns J-T (indices 9-19)
 *
 * Computes:
 *  - totalStudents: rows with a non-empty STUDENT NO. (excluding availability row)
 *  - totalGroups: populated group rows in the Groups sheet
 *  - totalActivities: deliverable headers in columns J-T
 *  - overallCompletionRate: (completed required entries / total required entries) * 100
 *  - activities: sorted ascending by completion rate (lowest first)
 */
function handleGetAdviserDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const groupsSheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
  const studentsSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);

  if (!groupsSheet || !studentsSheet) {
    return {
      success: false,
      message: "Required sheet(s) not found.",
    };
  }

  // 1. Count listed groups and map them for completion breakdowns.
  const groupsData = groupsSheet.getDataRange().getValues();
  const validGroupMap = {}; // groupCode (lower) -> { groupCode, title }
  let totalGroupRows = 0;

  if (groupsData.length >= 2) {
    const gHeaders = groupsData[0].map(function (h) {
      return String(h || "").trim().toUpperCase();
    });
    const colGroup = findHeaderIndex(gHeaders, ["GROUP", "GROUP NUMBER", "GROUP NO", "GROUP NO."]);
    const colTitle = findHeaderIndex(gHeaders, ["PROJECT TITLE", "TITLE"]);

    for (let r = 1; r < groupsData.length; r++) {
      const row = groupsData[r];
      const gCode = colGroup !== -1 ? String(row[colGroup] || "").trim() : "";
      const title = colTitle !== -1 ? String(row[colTitle] || "").trim() : "";
      if (gCode) {
        totalGroupRows++;
        const lower = gCode.toLowerCase();
        if (!validGroupMap[lower]) {
          validGroupMap[lower] = { groupCode: gCode, title: title || "None" };
        }
      }
    }
  }

  // 2. Read students and deliverables
  const studentLastRow = studentsSheet.getLastRow();
  const sData = studentLastRow > 0
    ? studentsSheet.getRange(1, 1, studentLastRow, ADVISER_STATS_COLUMN_COUNT).getValues()
    : [[]];
  const sHeaders = (sData[0] || []).map(function (h) {
    return String(h || "").trim().toUpperCase();
  });
  const deliverableColumns = getDeliverableColumns(sData[0] || []).filter(function (deliv) {
    return deliv.index >= 9 && deliv.index <= 19;
  });
  const colGroup = sHeaders.indexOf("GROUP");
  const colStudentNo = sHeaders.indexOf("STUDENT NO.");

  // Count and aggregate each student row in one pass.
  let totalStudentCount = 0;

  const activityList = [];
  const activityMap = {};

  deliverableColumns.forEach(function (deliv) {
    const actObj = {
      id: deliv.id,
      title: deliv.title,
      type: deliv.type,
      completedCount: 0,
      totalRequired: 0,
      groupBreakdown: [],
    };
    activityMap[deliv.index] = actObj;
    activityList.push(actObj);
  });

  // Track group counts
  const groupStatsMap = {}; // groupCode (lower) -> { totalMembers, completedPerDeliv: { [colIndex]: count } }

  for (let r = 1; r < sData.length; r++) {
    if (r === AVAILABILITY_ROW_INDEX - 1) continue; // skip availability flag row
    const row = sData[r];
    const rowStudentNo = colStudentNo !== -1 ? String(row[colStudentNo] || "").trim() : "";
    if (!rowStudentNo) continue; // skip blank/metadata rows
    totalStudentCount++;

    const rowGroup = colGroup !== -1 ? String(row[colGroup] || "").trim().toLowerCase() : "";

    // Group breakdowns only include rows assigned to a group listed in Groups.
    const hasListedGroup = Boolean(validGroupMap[rowGroup]);
    if (hasListedGroup && !groupStatsMap[rowGroup]) {
      groupStatsMap[rowGroup] = {
        totalMembers: 0,
        completedPerDeliv: {},
      };
    }

    const gStat = hasListedGroup ? groupStatsMap[rowGroup] : null;
    if (gStat) gStat.totalMembers++;

    deliverableColumns.forEach(function (deliv) {
      const val = row[deliv.index];
      const isCompleted = !isNotAvailableValue(val) &&
        val !== "" && val !== null && val !== undefined;

      if (isCompleted) {
        activityMap[deliv.index].completedCount++;
      }
      if (gStat && isCompleted) {
        gStat.completedPerDeliv[deliv.index] = (gStat.completedPerDeliv[deliv.index] || 0) + 1;
      }
    });
  }

  deliverableColumns.forEach(function (deliv) {
    const act = activityMap[deliv.index];
    // Use totalStudentCount so "out of X" matches the Total Students card
    act.totalRequired = totalStudentCount;

    Object.keys(validGroupMap).forEach(function (lowerCode) {
      const grp = validGroupMap[lowerCode];
      const gStat = groupStatsMap[lowerCode];
      const membersInGroup = gStat ? gStat.totalMembers : 0;
      const completedInGroup = (gStat && gStat.completedPerDeliv[deliv.index]) || 0;

      act.groupBreakdown.push({
        groupCode: grp.groupCode,
        groupTitle: grp.title,
        completed: completedInGroup,
        required: membersInGroup,
        status: completedInGroup >= membersInGroup && membersInGroup > 0 ? "Submitted" : "Not Available",
      });
    });
  });

  const activities = activityList.map(function (act) {
    const rate = act.totalRequired > 0
      ? Math.round((act.completedCount / act.totalRequired) * 1000) / 10
      : 0;
    return {
      id: act.id,
      title: act.title,
      type: act.type,
      completedCount: act.completedCount,
      totalRequired: act.totalRequired,
      completionRate: rate,
      groupBreakdown: act.groupBreakdown,
    };
  });

  let totalCompletedEntries = 0;
  let totalRequiredEntries = 0;
  activities.forEach(function (act) {
    totalCompletedEntries += act.completedCount;
    totalRequiredEntries += act.totalRequired;
  });

  // Sort lowest to highest
  activities.sort(function (a, b) {
    return a.completionRate - b.completionRate;
  });

  const overallRate = totalRequiredEntries > 0
    ? Math.round((totalCompletedEntries / totalRequiredEntries) * 1000) / 10
    : 0;

  return {
    success: true,
    data: {
      totalStudents: totalStudentCount,
      totalGroups: totalGroupRows,
      totalActivities: activities.length,
      overallCompletionRate: overallRate,
      completedEntries: totalCompletedEntries,
      totalRequiredEntries: totalRequiredEntries,
      activities: activities,
    },
  };
}

// ============================================================================

function doGet() {
  return ContentService
    .createTextOutput("Technopreneurship Tracker API is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}
// ============================================================================
// CCS_TEC_TRACKER → TEST SYNCHRONIZATION
// Copies all values from the private source spreadsheet
// to the private TEST sheet in this spreadsheet.
//
// SOURCE:
//   Spreadsheet ID: 15vPupFBL6CryxubhsSQwSu5gSU-xm_Ms2dQGwxoMXOQ
//   Sheet: CCS_TEC_Tracker
//
// DESTINATION:
//   Spreadsheet ID: 1ERnrccXBaGPFB-Ukcsjp2AUSNawO3U8dIjMQvfCXLVI
//   Sheet: TEST
// ============================================================================

const CCS_TEC_SOURCE_ID =
  '15vPupFBL6CryxubhsSQwSu5gSU-xm_Ms2dQGwxoMXOQ';

const CCS_TEC_SOURCE_SHEET =
  'CCS_TEC_Tracker';

const CCS_TEC_DESTINATION_ID =
  '1ERnrccXBaGPFB-Ukcsjp2AUSNawO3U8dIjMQvfCXLVI';

const CCS_TEC_DESTINATION_SHEET =
  'TEC_CSIT';


function synchronizeCCSTECTracker() {

  try {

    Logger.log('Starting synchronization...');

    // SOURCE
    const sourceSS = SpreadsheetApp.openById(
      '15vPupFBL6CryxubhsSQwSu5gSU-xm_Ms2dQGwxoMXOQ'
    );

    const sourceSheet = sourceSS.getSheetByName(
      'CCS_TEC_Tracker'
    );

    if (!sourceSheet) {
      throw new Error(
        'SOURCE SHEET NOT FOUND: CCS_TEC_Tracker'
      );
    }

    Logger.log(
      'Source found: ' +
      sourceSheet.getName()
    );

    const data = sourceSheet
      .getDataRange()
      .getValues();

    Logger.log(
      'Source data size: ' +
      data.length +
      ' rows x ' +
      data[0].length +
      ' columns'
    );


    // DESTINATION
    const destinationSS = SpreadsheetApp.openById(
      '1ERnrccXBaGPFB-Ukcsjp2AUSNawO3U8dIjMQvfCXLVI'
    );

    const destinationSheet =
      destinationSS.getSheetByName('TEC_CSIT');

    if (!destinationSheet) {
      throw new Error(
        'DESTINATION SHEET NOT FOUND: TEC_CSIT'
      );
    }

    Logger.log(
      'Destination found: ' +
      destinationSheet.getName()
    );


    // Clear existing contents
    destinationSheet.clearContents();


    // Make sure destination is large enough
    if (
      destinationSheet.getMaxRows() <
      data.length
    ) {
      destinationSheet.insertRowsAfter(
        destinationSheet.getMaxRows(),
        data.length -
        destinationSheet.getMaxRows()
      );
    }

    if (
      destinationSheet.getMaxColumns() <
      data[0].length
    ) {
      destinationSheet.insertColumnsAfter(
        destinationSheet.getMaxColumns(),
        data[0].length -
        destinationSheet.getMaxColumns()
      );
    }


    // Copy data
    destinationSheet
      .getRange(
        1,
        1,
        data.length,
        data[0].length
      )
      .setValues(data);


    Logger.log(
      'SUCCESS: ' +
      data.length +
      ' rows x ' +
      data[0].length +
      ' columns copied.'
    );

  } catch (error) {

    Logger.log(
      'ERROR: ' +
      error.toString()
    );

    throw error;
  }
}
