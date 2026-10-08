/**
 * ============================================================================
 * Technopreneurship Tracker - Google Apps Script Web App (Backend)
 * ============================================================================
 * Database Google Sheets:
 *  1. "Students"           - Student credentials, group, mentor, deliverables
 *  2. "Advisers"           - Adviser credentials (AdviserID, Name, PIN, Role)
 *  3. "GroupComments"      - Team-wide comments (Group, Adviser, Comment, Timestamp)
 *  4. "IndividualComments" - Student-private comments (StudentNo., Group, Student Name, Adviser, Comment, Timestamp)
 *  5. "Ratings"            - 1-5 ratings (TargetType, Group, StudentNo., Student Name, Adviser, Rating, Timestamp)
 *  6. "REF"                - Course reference data
 * ============================================================================
 */

const SHEET_NAMES = {
  STUDENTS: "Students",
  GROUPS: "Groups",
  ADVISERS: "Advisers",
  GROUP_COMMENTS: "GroupComments",
  INDIVIDUAL_COMMENTS: "IndividualComments",
  RATINGS: "Ratings",
  REF: "REF",
};

// Row 539 in Students sheet contains OPEN/CLOSED availability flags for deliverables
const AVAILABILITY_ROW_INDEX = 539;

// Deliverable column definitions in "Students" sheet
const DELIVERABLE_COLUMNS = [
  { key: "A1.1", label: "Activity 1.1 — Technopreneurship Guidelines", type: "document" },
  { key: "Q1.2", label: "Quiz 1.2 — Quiz 1", type: "quiz" },
  { key: "A2.1", label: "Activity 2.1 — Workbook Creation", type: "document" },
  { key: "A2.2", label: "Activity 2.2 — Starting a Tech-based Venture", type: "document" },
  { key: "A2.3", label: "Activity 2.3 — Competition Analysis", type: "document" },
  { key: "A2.4", label: "Activity 2.4 — Elevator Pitch", type: "pitch" },
  { key: "Q2.5", label: "Activity 2.5 — Quiz 2", type: "quiz" },
  { key: "A4.1", label: "Revised Elevator Pitch", type: "pitch" },
  { key: "A4.2", label: "Market Segmentation", type: "document" },
  { key: "A5.1", label: "Lean Canvas", type: "pitch" },
];

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

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Action: loginStudent
 * Validates Student No. and PIN against "Students" sheet.
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
    DELIVERABLE_COLUMNS.forEach(deliv => {
      const idx = headers.indexOf(deliv.key.toUpperCase());
      if (idx !== -1) {
        availabilityMap[deliv.key] = String(availRow[idx] || "").trim().toUpperCase();
      }
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
      const ssTimezone = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || "GMT+8";

      DELIVERABLE_COLUMNS.forEach(deliv => {
        const colIdx = headers.indexOf(deliv.key.toUpperCase());
        let isSubmitted = false;
        let submittedDate = null;

        if (colIdx !== -1) {
          const rawCell = row[colIdx];
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
        const rawAvail = availabilityMap[deliv.key];
        const isAvailable = (rawAvail !== undefined && rawAvail !== "")
          ? rawAvail === "OPEN"
          : true;
        const availabilityStr = isAvailable ? "Open" : "Closed";

        deliverables.push({
          id: deliv.key,
          title: deliv.label,
          type: deliv.type,
          status: isSubmitted ? "Submitted" : "Missing",
          isSubmitted: isSubmitted,
          submittedDate: submittedDate,
          availability: availabilityStr,
          dueDate: availabilityStr,
          daysLate: 0,
        });
      });

      const totalDeliverables = deliverables.length;
      const progress = totalDeliverables > 0 ? Math.round((submittedCount / totalDeliverables) * 100) : 0;

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

  const sheet = getOrCreateSheet(SHEET_NAMES.ADVISERS, ["AdviserID", "Name", "PIN", "Role"]);
  const data = sheet.getDataRange().getValues();

  // If table only has headers, initialize default guest account
  if (data.length <= 1) {
    sheet.appendRow(["guest", "Guest Adviser", "1234", "guest"]);
  }

  const refreshedData = sheet.getDataRange().getValues();
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

  const sheet = getOrCreateSheet(SHEET_NAMES.ADVISERS, ["AdviserID", "Name", "PIN", "Role"]);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    sheet.appendRow(["guest", "Guest Adviser", "1234", "guest"]);
  }

  const refreshedData = sheet.getDataRange().getValues();
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

  const data = sheet.getDataRange().getValues();
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) return { success: true, data: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toUpperCase());
  const colGroup = headers.indexOf("GROUP");
  const colStudentNo = headers.indexOf("STUDENT NO.");
  const colName = headers.indexOf("NAME OF STUDENT");
  const colMember = headers.indexOf("MEMBER #");

  const members = [];
  for (let r = 1; r < data.length; r++) {
    if (r === AVAILABILITY_ROW_INDEX - 1) continue;
    const row = data[r];
    if (String(row[colGroup] || "").trim().toLowerCase() === groupCode.toLowerCase()) {
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

  const colGroup = headers.indexOf("GROUP");

  if (colGroup === -1) {
    return {
      success: false,
      message: "GROUP column not found.",
    };
  }

  let totalSubmissions = 0;
  let totalExpected = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];

    const rowGroup = String(row[colGroup] || "").trim();

    if (rowGroup.toLowerCase() !== groupCode.toLowerCase()) {
      continue;
    }

    for (const deliverable of DELIVERABLE_COLUMNS) {
      const colIndex = headers.indexOf(
        deliverable.key.toUpperCase()
      );

      if (colIndex === -1) {
        continue;
      }

      totalExpected++;

      const value = String(row[colIndex] || "").trim();

      if (value !== "") {
        totalSubmissions++;
      }
    }
  }

  const progress =
    totalExpected > 0
      ? Math.round((totalSubmissions / totalExpected) * 100)
      : 0;

  return {
    success: true,
    progress: progress,
    submitted: totalSubmissions,
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

  const sheet = getOrCreateSheet(SHEET_NAMES.GROUP_COMMENTS, [
    "Group", "Adviser", "Comment", "Timestamp"
  ]);
  const data = sheet.getDataRange().getValues();
  const comments = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowGroup = String(row[0] || "").trim();
    if (rowGroup.toLowerCase() === groupCode.toLowerCase()) {
      comments.push({
        group: rowGroup,
        adviser: String(row[1] || "").trim(),
        comment: String(row[2] || "").trim(),
        timestamp: row[3] instanceof Date ? row[3].toISOString() : String(row[3] || ""),
      });
    }
  }

  // Newest first
  comments.reverse();

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

  const sheet = getOrCreateSheet(SHEET_NAMES.INDIVIDUAL_COMMENTS, [
    "StudentNo.", "Group", "Student Name", "Adviser", "Comment", "Timestamp"
  ]);
  const data = sheet.getDataRange().getValues();
  const comments = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowStudentNo = String(row[0] || "").trim();
    if (rowStudentNo.toLowerCase() === studentNo.toLowerCase()) {
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

  // Newest first
  comments.reverse();

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

  const sheet = getOrCreateSheet(SHEET_NAMES.RATINGS, [
    "TargetType", "Group", "StudentNo.", "Student Name", "Adviser", "Rating", "Timestamp"
  ]);
  const data = sheet.getDataRange().getValues();

  let latestGroupRating = null;
  let latestIndividualRating = null;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const targetType = String(row[0] || "").trim().toLowerCase();
    const rowGroup = String(row[1] || "").trim();
    const rowStudentNo = String(row[2] || "").trim();
    const adviser = String(row[4] || "").trim();
    const rating = Number(row[5]) || 0;
    const timestamp = row[6] instanceof Date ? row[6].toISOString() : String(row[6] || "");

    if (targetType === "group" && groupCode && rowGroup.toLowerCase() === groupCode.toLowerCase()) {
      latestGroupRating = { rating, adviser, timestamp };
    }

    if (targetType === "individual" && studentNo && rowStudentNo.toLowerCase() === studentNo.toLowerCase()) {
      latestIndividualRating = { rating, adviser, timestamp };
    }
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

  const colGroup = headers.indexOf("GROUP");

  if (colGroup === -1) {
    return {
      success: false,
      message: "GROUP column not found.",
    };
  }

  const groupRows = data.slice(1).filter((row) => {
    const rowGroup = String(row[colGroup] || "").trim();
    return rowGroup.toLowerCase() === groupCode.toLowerCase();
  });

  if (groupRows.length === 0) {
    return {
      success: true,
      data: [],
    };
  }

  const timeZone = ss.getSpreadsheetTimeZone();

  const deliverables = DELIVERABLE_COLUMNS.map((deliverable) => {
    const colIndex = headers.indexOf(
      deliverable.key.toUpperCase()
    );

    if (colIndex === -1) {
      return {
        id: deliverable.key,
        title: deliverable.label,
        type: deliverable.type,
        status: "Missing",
        submittedCount: 0,
        totalMembers: groupRows.length,
        submittedDate: null,
        daysLate: 0,
      };
    }

    let submittedCount = 0;
    let latestSubmittedDate = null;

    groupRows.forEach((row) => {
      const value = row[colIndex];

      if (
        value !== "" &&
        value !== null &&
        value !== undefined
      ) {
        submittedCount++;

        if (value instanceof Date) {
          if (
            !latestSubmittedDate ||
            value > latestSubmittedDate
          ) {
            latestSubmittedDate = value;
          }
        }
      }
    });

    const totalMembers = groupRows.length;

    const allSubmitted =
      submittedCount === totalMembers;

    let formattedSubmittedDate = null;

    if (allSubmitted && latestSubmittedDate) {
      formattedSubmittedDate = Utilities.formatDate(
        latestSubmittedDate,
        timeZone,
        "MMMM d, yyyy"
      );
    }

    return {
      id: deliverable.key,
      title: deliverable.label,
      type: deliverable.type,

      status: allSubmitted
        ? "Submitted"
        : "Missing",

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
  'TEST';


function synchronizeCCSTECTracker() {

  try {

    // ------------------------------------------------------------
    // OPEN SOURCE
    // ------------------------------------------------------------

    const sourceSS =
      SpreadsheetApp.openById(CCS_TEC_SOURCE_ID);

    const sourceSheet =
      sourceSS.getSheetByName(CCS_TEC_SOURCE_SHEET);

    if (!sourceSheet) {
      throw new Error(
        'Source sheet "' +
        CCS_TEC_SOURCE_SHEET +
        '" was not found.'
      );
    }


    // ------------------------------------------------------------
    // READ SOURCE DATA
    // ------------------------------------------------------------

    const sourceRange =
      sourceSheet.getDataRange();

    const data =
      sourceRange.getValues();


    // ------------------------------------------------------------
    // OPEN DESTINATION
    // ------------------------------------------------------------

    const destinationSS =
      SpreadsheetApp.openById(CCS_TEC_DESTINATION_ID);

    const destinationSheet =
      destinationSS.getSheetByName(CCS_TEC_DESTINATION_SHEET);

    if (!destinationSheet) {
      throw new Error(
        'Destination sheet "' +
        CCS_TEC_DESTINATION_SHEET +
        '" was not found.'
      );
    }


    // ------------------------------------------------------------
    // CLEAR OLD DATA
    // ------------------------------------------------------------

    destinationSheet.clearContent();


    // ------------------------------------------------------------
    // STOP IF SOURCE IS EMPTY
    // ------------------------------------------------------------

    if (
      data.length === 0 ||
      data[0].length === 0
    ) {
      console.log('Source sheet is empty.');
      return;
    }


    // ------------------------------------------------------------
    // MAKE SURE DESTINATION HAS ENOUGH ROWS
    // ------------------------------------------------------------

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


    // ------------------------------------------------------------
    // MAKE SURE DESTINATION HAS ENOUGH COLUMNS
    // ------------------------------------------------------------

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


    // ------------------------------------------------------------
    // WRITE DATA
    // ------------------------------------------------------------

    destinationSheet
      .getRange(
        1,
        1,
        data.length,
        data[0].length
      )
      .setValues(data);


    // ------------------------------------------------------------
    // LOG RESULT
    // ------------------------------------------------------------

    console.log(
      'CCS_TEC_Tracker synchronization completed: ' +
      data.length +
      ' rows × ' +
      data[0].length +
      ' columns.'
    );

  } catch (error) {

    console.error(
      'CCS_TEC_Tracker synchronization failed: ' +
      error.toString()
    );

    throw error;
  }
}
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
      destinationSS.getSheetByName('TEST');

    if (!destinationSheet) {
      throw new Error(
        'DESTINATION SHEET NOT FOUND: TEST'
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
