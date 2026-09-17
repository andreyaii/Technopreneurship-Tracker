/**
 * mockData.js
 * ------------------------------------------------------------------
 * This file is the ONLY place that holds raw data for the prototype.
 * It stands in for what will eventually be rows in a Google Sheet.
 *
 * Entities are kept separate on purpose:
 *   - students            -> one row per student, no project text duplicated
 *   - projects            -> one row per group, title/description live here ONCE
 *   - studentRequirements -> one row per (student, requirement) pair
 *   - requirementDefs     -> the canonical order + default due dates
 *
 * Nothing in here should be imported directly by pages/components.
 * Everything is accessed through src/services/projectService.js so the
 * mock implementation can be swapped for a Google Apps Script API later
 * without touching the UI.
 * ------------------------------------------------------------------
 */

// The four requirement types, in their real SDLC order.
// dueDate is a placeholder here — later this can come from the sheet.
export const requirementDefs = [
  { key: "ReqInventory", label: "Requirement Inventory", dueDate: "2026-09-05" },
  { key: "SRS", label: "Software Requirements Spec. (SRS)", dueDate: "2026-09-19" },
  { key: "SDD", label: "Software Design Doc. (SDD)", dueDate: "2026-10-03" },
  { key: "SPMP", label: "Project Management Plan (SPMP)", dueDate: "2026-10-17" },
];

// value 0 or 1 = Missing (not submitted), 2 = Submitted
const STATUS_BY_VALUE = ["Missing", "Missing", "Submitted"];
const PROGRESS_BY_VALUE = [0, 0, 100];

export const students = [
  { studentNo: "24-3906-492", name: "ABARQUEZ, YOHANN M.", section: "GO1", instructor: "Engr. Ralph P. Laviste", groupCode: "2526-sem2-it411-01", pin: "1234" },
  { studentNo: "18-1745-979", name: "LABAJOS, ANDREA JOANNE A.", section: "GO1", instructor: "Engr. Ralph P. Laviste", groupCode: "2526-sem2-it411-01", pin: "1234" },
  { studentNo: "22-4722-701", name: "ESTOPACE, DERRICK M.", section: "GO1", instructor: "Engr. Ralph P. Laviste", groupCode: "2526-sem2-it411-01", pin: "1234" },
  { studentNo: "19-3026-410", name: "OPINION, SHANE ADRIAN C.", section: "GO1", instructor: "Engr. Ralph P. Laviste", groupCode: "2526-sem2-it411-01", pin: "1234" },
  { studentNo: "22-4672-711", name: "POGOY, JOHN MICHAEL I.", section: "GO1", instructor: "Engr. Ralph P. Laviste", groupCode: "2526-sem2-it411-01", pin: "1234" },

  { studentNo: "22-3329-130", name: "LABORADA, JOHN JOSEPH A.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-02", pin: "1234" },
  { studentNo: "22-1825-345", name: "LAPURE, JESSIE NOEL D.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-02", pin: "1234" },
  { studentNo: "22-6109-516", name: "LAWAS, JOSE RAPHAEL R.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-02", pin: "1234" },
  { studentNo: "22-1137-480", name: "PEPITO, JOHN PATRICK G.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-02", pin: "1234" },
  { studentNo: "14-0438-845", name: "VERANO, JOEL JR. M.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-02", pin: "1234" },

  { studentNo: "22-5709-645", name: "CANTILLER, CHRISTIAN JAYSON J.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-03", pin: "1234" },
  { studentNo: "21-4995-761", name: "DIVA, JUSTIN ANDRY N.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-03", pin: "1234" },
  { studentNo: "17-0136-431", name: "DY, JIVONZ M.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-03", pin: "1234" },
  { studentNo: "23-5649-484", name: "GO, FELIX CHRISTIAN T.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-03", pin: "1234" },
  { studentNo: "19-4436-202", name: "LADA, NATHAN XANDER", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-03", pin: "1234" },

  { studentNo: "22-6058-210", name: "AHITO, BERNADETH CLAIRE G.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-04", pin: "1234" },
  { studentNo: "2007-40198", name: "ALIVIO, ALYSSA BLANCHE S.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-04", pin: "1234" },
  { studentNo: "21-2179-698", name: "CARAO, ESTELLE FELICITY T.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-04", pin: "1234" },
  { studentNo: "19-1256-647", name: "COCA, JUVIE R.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-04", pin: "1234" },
  { studentNo: "23-7717-740", name: "SEPULVEDA, KYLE E.", section: "GO1", mentor: "Engr. Jonathan A. Cartilla", groupCode: "2526-sem2-it411-04", pin: "1234" },
];

// Raw per-student, per-requirement values taken straight from the roster.
// This is deliberately the only place these numbers live.
const RAW_STUDENT_REQ_VALUES = {
  "24-3906-492": [0, 0, 0, 0],
  "22-2730-457": [0, 2, 2, 0],
  "22-4722-701": [0, 0, 0, 0],
  "19-3026-410": [2, 2, 2, 2],
  "22-4672-711": [0, 0, 0, 0],
  "22-3329-130": [0, 0, 0, 0],
  "22-1825-345": [0, 0, 0, 0],
  "22-6109-516": [0, 0, 0, 0],
  "22-1137-480": [0, 0, 0, 0],
  "14-0438-845": [0, 0, 0, 0],
  "22-5709-645": [0, 0, 0, 0],
  "21-4995-761": [0, 0, 0, 0],
  "17-0136-431": [0, 0, 0, 0],
  "23-5649-484": [0, 0, 0, 0],
  "19-4436-202": [0, 0, 0, 0],
  "22-6058-210": [0, 0, 0, 0],
  "2007-40198": [0, 0, 0, 0],
  "21-2179-698": [0, 0, 0, 0],
  "19-1256-647": [0, 0, 0, 0],
  "23-7717-740": [0, 0, 0, 0],
};

// Expand the raw values into one row per (student, requirement) — this is
// the shape a Google Sheet "StudentRequirements" tab would realistically have.
export const studentRequirements = Object.entries(RAW_STUDENT_REQ_VALUES).flatMap(
  ([studentNo, values]) =>
    requirementDefs.map((def, i) => {
      const status = STATUS_BY_VALUE[values[i]];
      const isSubmitted = status === "Submitted";
      return {
        studentNo,
        requirement: def.key,
        label: def.label,
        dueDate: def.dueDate,
        status,
        progress: PROGRESS_BY_VALUE[values[i]],
        submittedDate: isSubmitted ? def.dueDate : null,
      };
    })
);

// One row per group. Title/description live ONLY here, never on the student.
export const projects = [
  {
    groupCode: "2526-sem2-it411-01",
    title: "AgriConnect",
    description:
      "A smart monitoring platform that helps small-scale farmers track soil conditions and crop health using low-cost sensors.",
  },
  {
    groupCode: "2526-sem2-it411-02",
    title: "MediQueue",
    description:
      "A digital queueing and referral system that reduces waiting time for patients at community health centers.",
  },
  {
    groupCode: "2526-sem2-it411-03",
    title: "EcoTrack",
    description:
      "An environmental monitoring system for schools that logs air quality and waste data to support campus sustainability drives.",
  },
  {
    groupCode: "2526-sem2-it411-04",
    title: "CampusEats",
    description:
      "A pre-order and pickup-scheduling app for campus food stalls, built to cut down lunch-break queues.",
  },
];
