/**
 * mockDeliverables.js
 * ------------------------------------------------------------------
 * Course deliverable catalog + per-group submission records.
 * Status is only ever Submitted or Missing — no grades or scores.
 *
 * Pages must not import this file. Use projectService.getGroupDeliverables.
 * ------------------------------------------------------------------
 */

export const deliverableCatalog = [
  {
    id: "deliv-01",
    title: "Technopreneurship Guidelines & Syllabus Acknowledgement",
    category: "Orientation",
    type: "document",
    dueDate: "Aug 25, 2026",
  },
  {
    id: "deliv-02",
    title: "Quiz 1: Lean Startup & Value Proposition",
    category: "Assessment",
    type: "quiz",
    dueDate: "Sep 02, 2026",
  },
  {
    id: "deliv-03",
    title: "Elevator Pitch & Problem Definition Deck",
    category: "Milestone",
    type: "pitch",
    dueDate: "Sep 15, 2026",
  },
  {
    id: "deliv-04",
    title: "Requirement Inventory",
    category: "SDLC",
    type: "document",
    dueDate: "Sep 05, 2026",
  },
  {
    id: "deliv-05",
    title: "Software Requirements Spec. (SRS)",
    category: "SDLC",
    type: "document",
    dueDate: "Sep 19, 2026",
  },
  {
    id: "deliv-06",
    title: "Customer Discovery & Market Validation Report",
    category: "Research",
    type: "report",
    dueDate: "Sep 28, 2026",
  },
  {
    id: "deliv-07",
    title: "Software Design Doc. (SDD)",
    category: "SDLC",
    type: "document",
    dueDate: "Oct 03, 2026",
  },
  {
    id: "deliv-08",
    title: "Midterm MVP Prototype Demonstration",
    category: "Milestone",
    type: "presentation",
    dueDate: "Oct 12, 2026",
  },
  {
    id: "deliv-09",
    title: "Project Management Plan (SPMP)",
    category: "SDLC",
    type: "document",
    dueDate: "Oct 17, 2026",
  },
  {
    id: "deliv-10",
    title: "Business Model Canvas (BMC) & Revenue Streams",
    category: "Strategy",
    type: "document",
    dueDate: "Oct 26, 2026",
  },
  {
    id: "deliv-11",
    title: "Final Venture Pitch & Investor Deck",
    category: "Final Defense",
    type: "pitch",
    dueDate: "Nov 15, 2026",
  },
];

/**
 * Submitted deliverables per group. If an id is missing here, it is Missing.
 * Values are submitted dates only — never grades.
 */
export const groupSubmissions = {
  "2526-sem2-it411-01": {
    "deliv-01": { submittedDate: "Aug 24, 2026" },
    "deliv-02": { submittedDate: "Sep 01, 2026" },
    "deliv-03": { submittedDate: "Sep 14, 2026" },
    "deliv-05": { submittedDate: "Sep 18, 2026" },
    "deliv-07": { submittedDate: "Oct 02, 2026" },
  },
  "2526-sem2-it411-02": {},
  "2526-sem2-it411-03": {
    "deliv-01": { submittedDate: "Aug 25, 2026" },
  },
  "2526-sem2-it411-04": {},
};
