import { ReminderState, SymptomSeverity } from "@prisma/client";
import { db } from "@/lib/db";

export type ReviewQueueItem = {
  id: string;
  category: "OVERDUE_REMINDER" | "MISSED_REMINDER" | "SEVERE_SYMPTOM" | "ABNORMAL_LAB";
  title: string;
  description: string;
  occurredAt: Date;
  href: string;
  tone: "warning" | "danger" | "info";
};

export async function getReviewQueueData(userId: string) {
  const [overdueReminders, severeSymptoms, abnormalLabs] = await Promise.all([
    db.reminder.findMany({
      where: {
        userId,
        state: {
          in: [ReminderState.OVERDUE, ReminderState.MISSED],
        },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    db.symptomEntry.findMany({
      where: {
        userId,
        severity: SymptomSeverity.SEVERE,
      },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
    db.labResult.findMany({
      where: {
        userId,
        flag: {
          in: ["HIGH", "LOW"],
        },
      },
      orderBy: { dateTaken: "desc" },
      take: 20,
    }),
  ]);

  const items: ReviewQueueItem[] = [
    ...overdueReminders.map((item) => ({
      id: item.id,
      category:
        item.state === ReminderState.MISSED ? "MISSED_REMINDER" : "OVERDUE_REMINDER",
      title: item.title,
      description: item.description ?? "Reminder needs follow-up.",
      occurredAt: item.dueAt,
      href: "/reminders",
      tone: item.state === ReminderState.MISSED ? "danger" : "warning",
    })),
    ...severeSymptoms.map((item) => ({
      id: item.id,
      category: "SEVERE_SYMPTOM",
      title: item.title,
      description: item.notes ?? "Severe symptom logged.",
      occurredAt: item.recordedAt,
      href: "/symptoms",
      tone: "danger" as const,
    })),
    ...abnormalLabs.map((item) => ({
      id: item.id,
      category: "ABNORMAL_LAB",
      title: `${item.testName}${item.resultValue ? ` • ${item.resultValue}` : ""}`,
      description: item.notes ?? `Flagged result (${item.flag}).`,
      occurredAt: item.dateTaken,
      href: "/labs",
      tone: "warning" as const,
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return {
    items,
    summary: {
      overdueReminders: overdueReminders.filter((item) => item.state === ReminderState.OVERDUE)
        .length,
      missedReminders: overdueReminders.filter((item) => item.state === ReminderState.MISSED)
        .length,
      severeSymptoms: severeSymptoms.length,
      abnormalLabs: abnormalLabs.length,
      total: items.length,
    },
  };
}
