/**
 * Type definitions for Course Deliverables
 */

export type DeliverableStatus = "Submitted" | "Missing";

export type DeliverableType =
  | "document"
  | "quiz"
  | "pitch"
  | "report"
  | "presentation";

export interface Deliverable {
  id: string | number;
  title: string;
  dueDate: string;
  isSubmitted: boolean;
  submittedDate: string | null;
  status: DeliverableStatus;
  category?: string;
  type?: DeliverableType | string;
}
