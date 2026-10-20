import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * Replicate Code.gs logic in isolation to test Google Apps Script credential verification
 */
function simulateGoogleAppsScriptLogin({
  dataRows,
  displayRows,
  headers,
  studentNo,
  pin,
}) {
  const colIndex = {
    studentNo: headers.indexOf("STUDENT NO."),
    pin: headers.indexOf("PIN"),
    name: headers.indexOf("NAME OF STUDENT"),
  };

  const inputStudentNo = String(studentNo || "").trim();
  const inputPin = pin !== undefined && pin !== null ? String(pin) : "";

  if (!inputStudentNo || !inputPin || inputPin.trim() === "") {
    return { success: false, message: "Student number and PIN are required." };
  }

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    const rowStudentNo = String(row[colIndex.studentNo] || "").trim();

    if (rowStudentNo.toLowerCase() === inputStudentNo.toLowerCase()) {
      const displayVal = displayRows && displayRows[r] ? String(displayRows[r][colIndex.pin] || "") : "";
      const rawVal = String(row[colIndex.pin] !== null && row[colIndex.pin] !== undefined ? row[colIndex.pin] : "");
      const storedPin = displayVal.trim() !== "" ? displayVal : rawVal;

      if (!storedPin || storedPin.trim() === "") {
        return {
          success: false,
          message: "Account credentials are not configured. Please contact your adviser or administrator.",
        };
      }

      if (storedPin !== inputPin && storedPin.trim() !== inputPin.trim()) {
        return { success: false, message: "Invalid student number or PIN." };
      }

      return {
        success: true,
        student: {
          studentNo: rowStudentNo,
          name: String(row[colIndex.name] || "").trim(),
        },
      };
    }
  }

  return { success: false, message: "Student record not found." };
}

describe("Google Apps Script Credential Verification", () => {
  const headers = ["STUDENT NO.", "NAME OF STUDENT", "PIN"];
  const testSheetData = [
    // 0: 6-digit PIN
    ["24-0001-001", "Student Six Digit", "123456"],
    // 1: Long password (>6 chars)
    ["24-0002-002", "Student Long Pass", "SuperSecretPassword2026!"],
    // 2: Alphanumeric password
    ["24-0003-003", "Student Alphanumeric", "Alpha99X"],
    // 3: Leading zero PIN stored as number in raw data, but display has leading zeros
    ["24-0004-004", "Student Leading Zero Display", 1234],
    // 4: Leading zero PIN stored as text
    ["24-0005-005", "Student Leading Zero Text", "001234"],
    // 5: Empty PIN cell
    ["24-0006-006", "Student Empty Pin", ""],
    // 6: Whitespace-only PIN cell
    ["24-0007-007", "Student Whitespace Pin", "   "],
    // 7: 4-digit PIN (shorter than 6 digits)
    ["24-0008-008", "Student Short Pin", "1234"],
  ];

  const testSheetDisplay = [
    ["24-0001-001", "Student Six Digit", "123456"],
    ["24-0002-002", "Student Long Pass", "SuperSecretPassword2026!"],
    ["24-0003-003", "Student Alphanumeric", "Alpha99X"],
    ["24-0004-004", "Student Leading Zero Display", "001234"], // display preserves formatted leading zeros
    ["24-0005-005", "Student Leading Zero Text", "001234"],
    ["24-0006-006", "Student Empty Pin", ""],
    ["24-0007-007", "Student Whitespace Pin", "   "],
    ["24-0008-008", "Student Short Pin", "1234"],
  ];

  test("1. A student with a six-digit PIN can log in", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0001-001",
      pin: "123456",
    });
    assert.equal(res.success, true);
    assert.equal(res.student.name, "Student Six Digit");
  });

  test("2. A student with a password longer than six characters can log in", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0002-002",
      pin: "SuperSecretPassword2026!",
    });
    assert.equal(res.success, true);
    assert.equal(res.student.name, "Student Long Pass");
  });

  test("3. A student with an alphanumeric password can log in", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0003-003",
      pin: "Alpha99X",
    });
    assert.equal(res.success, true);
    assert.equal(res.student.name, "Student Alphanumeric");
  });

  test("4. A PIN with leading zeros is preserved and validated correctly (formatted display)", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0004-004",
      pin: "001234",
    });
    assert.equal(res.success, true);
    assert.equal(res.student.name, "Student Leading Zero Display");

    // Must NOT match numeric 1234 when 001234 was expected
    const wrongRes = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0004-004",
      pin: "1234",
    });
    assert.equal(wrongRes.success, false);
    assert.equal(wrongRes.message, "Invalid student number or PIN.");
  });

  test("5. A PIN with leading zeros as text is preserved and validated correctly", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0005-005",
      pin: "001234",
    });
    assert.equal(res.success, true);
  });

  test("6. A student with an empty password/PIN cell cannot log in", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0006-006",
      pin: "123456",
    });
    assert.equal(res.success, false);
    assert.equal(
      res.message,
      "Account credentials are not configured. Please contact your adviser or administrator."
    );
  });

  test("7. A student with whitespace-only password/PIN cell cannot log in", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0007-007",
      pin: "   ",
    });
    assert.equal(res.success, false);
  });

  test("8. Submitting an empty PIN from frontend is rejected", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0001-001",
      pin: "",
    });
    assert.equal(res.success, false);
    assert.equal(res.message, "Student number and PIN are required.");
  });

  test("9. An incorrect password is rejected", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0001-001",
      pin: "999999",
    });
    assert.equal(res.success, false);
    assert.equal(res.message, "Invalid student number or PIN.");
  });

  test("10. A student with a 4-digit PIN can log in", () => {
    const res = simulateGoogleAppsScriptLogin({
      dataRows: testSheetData,
      displayRows: testSheetDisplay,
      headers,
      studentNo: "24-0008-008",
      pin: "1234",
    });
    assert.equal(res.success, true);
  });
});
