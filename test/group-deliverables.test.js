import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  filterGroupDeliverables,
  getGroupDeliverableStatus,
  getGroupDeliverableStatusCounts,
  GROUP_DELIVERABLE_STATUS,
} from "../src/utils/groupDeliverableStatus.js";

const appsScript = readFileSync(
  new URL("../google-apps-script/Code.gs", import.meta.url),
  "utf8"
);

function runGroupDeliverablesHandler(rows) {
  const headers = [
    "NO",
    "NAME OF STUDENT",
    "STUDENT NO.",
    "PROGRAM",
    "SEC",
    "GROUP",
    "MEMBER #",
    "MENTOR",
    "PIN",
    "Quiz 1",
  ];
  const values = [headers, ...rows];
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => ({
          getDataRange: () => ({ getValues: () => values }),
        }),
        getSpreadsheetTimeZone: () => "GMT",
      }),
    },
    Utilities: {
      formatDate: () => "Jan 1, 2026",
    },
  };

  return vm.runInNewContext(
    `${appsScript}\nhandleGetGroupDeliverables({ groupCode: "G1" });`,
    context
  );
}

function runStudentLoginHandler(row) {
  const headers = [
    "NO",
    "NAME OF STUDENT",
    "STUDENT NO.",
    "PROGRAM",
    "SEC",
    "GROUP",
    "MEMBER #",
    "MENTOR",
    "PIN",
    "Quiz 1",
    "Quiz 2",
    "Quiz 3",
  ];
  const values = [headers, row];
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => ({
          getDataRange: () => ({ getValues: () => values }),
        }),
        getSpreadsheetTimeZone: () => "GMT",
      }),
    },
    Utilities: {
      formatDate: () => "Jan 1, 2026",
    },
  };

  return vm.runInNewContext(
    `${appsScript}\nhandleLoginStudent({ studentNo: "S1", pin: "1234" });`,
    context
  );
}

function studentRow(studentNo, quizValue) {
  return [
    "",
    `Student ${studentNo}`,
    studentNo,
    "",
    "",
    "G1",
    "",
    "",
    "",
    quizValue,
  ];
}

describe("Group deliverable aggregation", () => {
  for (const [submittedMembers, expectedStatus] of [
    [9, GROUP_DELIVERABLE_STATUS.SUBMITTED],
    [5, GROUP_DELIVERABLE_STATUS.IN_PROGRESS],
    [2, GROUP_DELIVERABLE_STATUS.IN_PROGRESS],
    [0, GROUP_DELIVERABLE_STATUS.NOT_AVAILABLE],
  ]) {
    it(`reports ${submittedMembers}/9 members as ${expectedStatus}`, () => {
      const rows = Array.from({ length: 9 }, (_, index) =>
        studentRow(
          `S${index + 1}`,
          index < submittedMembers ? "Submitted" : ""
        )
      );
      const response = runGroupDeliverablesHandler(rows);
      const [deliverable] = response.data;

      assert.equal(response.success, true);
      assert.equal(deliverable.submittedCount, submittedMembers);
      assert.equal(deliverable.totalMembers, 9);
      assert.equal(deliverable.status, expectedStatus);
    });
  }

  it("excludes rows without a student number and returns empty data when none are valid", () => {
    const invalidRosterRow = studentRow("", "Submitted");
    const response = runGroupDeliverablesHandler([invalidRosterRow]);

    assert.equal(response.success, true);
    assert.equal(response.data.length, 0);
  });

  it("continues treating blank and #N/A cells as non-submissions", () => {
    const response = runGroupDeliverablesHandler([
      studentRow("S1", ""),
      studentRow("S2", "#N/A"),
      studentRow("S3", "Submitted"),
    ]);
    const [deliverable] = response.data;

    assert.equal(deliverable.submittedCount, 1);
    assert.equal(deliverable.totalMembers, 3);
    assert.equal(deliverable.status, GROUP_DELIVERABLE_STATUS.IN_PROGRESS);
  });

  it("preserves individual login statuses for blank, #N/A, and submitted cells", () => {
    const response = runStudentLoginHandler([
      "1",
      "Student One",
      "S1",
      "",
      "",
      "G1",
      "1",
      "",
      "1234",
      "",
      "#N/A",
      "Submitted",
    ]);

    assert.equal(response.success, true);
    assert.deepEqual(
      Array.from(response.student.deliverables, (item) => item.status),
      ["Not Available", "Not Available", "Submitted"]
    );
  });
});

describe("Adviser group deliverable status filters", () => {
  const deliverables = [
    {
      id: "complete",
      status: GROUP_DELIVERABLE_STATUS.SUBMITTED,
      submittedCount: 9,
      totalMembers: 9,
    },
    {
      id: "partial",
      status: GROUP_DELIVERABLE_STATUS.IN_PROGRESS,
      submittedCount: 5,
      totalMembers: 9,
    },
    {
      id: "none",
      status: GROUP_DELIVERABLE_STATUS.NOT_AVAILABLE,
      submittedCount: 0,
      totalMembers: 9,
    },
  ];

  it("counts and filters all three statuses independently", () => {
    assert.deepEqual(getGroupDeliverableStatusCounts(deliverables), {
      submitted: 1,
      inProgress: 1,
      notAvailable: 1,
    });
    assert.deepEqual(
      filterGroupDeliverables(deliverables, "submitted").map((item) => item.id),
      ["complete"]
    );
    assert.deepEqual(
      filterGroupDeliverables(deliverables, "inProgress").map((item) => item.id),
      ["partial"]
    );
    assert.deepEqual(
      filterGroupDeliverables(deliverables, "notAvailable").map((item) => item.id),
      ["none"]
    );
    assert.equal(filterGroupDeliverables(deliverables).length, 3);
  });

  it("classifies legacy count-bearing records without a group status", () => {
    assert.equal(
      getGroupDeliverableStatus({
        submittedCount: 2,
        totalMembers: 9,
      }),
      GROUP_DELIVERABLE_STATUS.IN_PROGRESS
    );
  });
});
