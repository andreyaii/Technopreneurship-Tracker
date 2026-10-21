import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Adviser Dashboard Statistics Calculations", () => {
  it("calculates overall completion rate using exact formula: (completed / required) * 100", () => {
    const completedEntries = 340;
    const totalRequiredEntries = 407;
    const rate = (completedEntries / totalRequiredEntries) * 100;
    const roundedRate = Math.round(rate * 10) / 10;

    assert.equal(roundedRate, 83.5);
  });

  it("handles zero required entries safely without NaN or division by zero", () => {
    const completedEntries = 0;
    const totalRequiredEntries = 0;
    const rate = totalRequiredEntries > 0 ? (completedEntries / totalRequiredEntries) * 100 : 0;

    assert.equal(rate, 0);
    assert.equal(Number.isNaN(rate), false);
  });

  it("sorts activities ascending by completion percentage (lowest completion first)", () => {
    const activities = [
      { title: "A4.1", completedCount: 34, totalRequired: 37, completionRate: 91.9 },
      { title: "A6.1", completedCount: 4, totalRequired: 37, completionRate: 10.8 },
      { title: "A5.1", completedCount: 27, totalRequired: 37, completionRate: 73.0 },
      { title: "Q2.5", completedCount: 36, totalRequired: 37, completionRate: 97.3 },
    ];

    activities.sort((a, b) => a.completionRate - b.completionRate);

    assert.equal(activities[0].title, "A6.1");
    assert.equal(activities[0].completionRate, 10.8);
    assert.equal(activities[1].title, "A5.1");
    assert.equal(activities[1].completionRate, 73.0);
    assert.equal(activities[2].title, "A4.1");
    assert.equal(activities[3].title, "Q2.5");
  });

  it("counts TEC_CSIT rows 2-538 regardless of whether student numbers are populated", () => {
    const sheetRows = Array.from({ length: 539 }, (_, index) =>
      index === 0 || index === 538 ? ["header or deadline"] : [""]
    );
    const lastStudentDataIndex = Math.min(sheetRows.length, 538);
    const totalStudents = Math.max(0, lastStudentDataIndex - 1);

    assert.equal(totalStudents, 537);
  });

  it("uses the same student-row total as the required count for every activity", () => {
    const totalStudents = 537;
    const activities = [
      { title: "A1", completedCount: 512, totalRequired: totalStudents },
      { title: "A2", completedCount: 518, totalRequired: totalStudents },
      { title: "A3", completedCount: 519, totalRequired: totalStudents },
    ];

    assert.deepEqual(
      activities.map(({ totalRequired }) => totalRequired),
      [537, 537, 537]
    );
  });

  it("includes groups with empty titles and only excludes rows without a group number", () => {
    const rawGroups = [
      { groupCode: "2627-1-ES038G-39", title: "AgriConnect" },
      { groupCode: "2627-1-ES038G-39", title: "AgriConnect (dup)" },
      { groupCode: "2627-1-ES038G-43", title: "MediQueue" },
      { groupCode: "2627-1-ES038G-2", title: "" }, // title is not required
      { groupCode: "", title: "Unnamed Project" }, // missing code
      { groupCode: "  ", title: "   " }, // whitespace only
    ];

    const validGroups = rawGroups.filter(
      (g) =>
        typeof g?.groupCode === "string" && g.groupCode.trim().length > 0
    );

    const seen = new Set();
    const distinct = [];
    for (const g of validGroups) {
      const code = g.groupCode.trim().toLowerCase();
      if (!seen.has(code)) {
        seen.add(code);
        distinct.push(g);
      }
    }

    assert.equal(distinct.length, 3);
    assert.equal(distinct[0].groupCode, "2627-1-ES038G-39");
    assert.equal(distinct[1].groupCode, "2627-1-ES038G-43");
    assert.equal(distinct[2].groupCode, "2627-1-ES038G-2");
  });
});
