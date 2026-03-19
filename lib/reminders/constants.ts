import { ReminderType } from "@prisma/client";

export const reminderTypeLabel: Record<ReminderType, string> = {
  MEDICATION: "Medication",
  APPOINTMENT: "Appointment",
  VACCINATION: "Vaccination",
  LAB_FOLLOW_UP: "Lab Follow-up",
  GENERAL: "General",
};

export const reminderStateLabel: Record<string, string> = {
  DUE: "Due",
  SENT: "Sent",
  OVERDUE: "Overdue",
  SKIPPED: "Skipped",
  COMPLETED: "Completed",
  MISSED: "Missed",
};

export function reminderStateTone(state: string) {
  switch (state) {
    case "DUE":
      return "info";
    case "SENT":
      return "neutral";
    case "OVERDUE":
      return "warning";
    case "MISSED":
      return "danger";
    case "COMPLETED":
      return "success";
    case "SKIPPED":
      return "neutral";
    default:
      return "neutral";
  }
}