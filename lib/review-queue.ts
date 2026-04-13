import { LabFlag, ReminderState, SymptomSeverity } from "@prisma/client";
import { db } from "@/lib/db";

export type ReviewQueueCategory =
  | "OVERDUE_REMINDER"
  | "MISSED_REMINDER"
  | "SEVERE_SYMPTOM"
  | "ABNORMAL_LAB";

export type ReviewQueueTone = "warning" | "danger" | "neutral";

export interface ReviewQueueItem {
  id: string;
  category: ReviewQueueCategory;
  title: string;
  description: string;
  occurredAt: Date;
  href: string;
  tone: ReviewQueueTone;
}

export async function getReviewQueueData(userId: string) {
  const [overdueReminders, missedReminders, severeSymptoms, abnormalLabs] = await Promise.all([
    db.reminder.findMany({
      where: { userId, state: ReminderState.OVERDUE },
      orderBy: { dueAt: "asc" },
      take: 25,
    }),
    db.reminder.findMany({
      where: { userId, state: ReminderState.MISSED },
      orderBy: { missedAt: "desc" },
      take: 25,
    }),
    db.symptomEntry.findMany({
      where: {
        userId,
        severity: SymptomSeverity.SEVERE,
        resolved: false,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    db.labResult.findMany({
      where: {
        userId,
        flag: {
          in: [LabFlag.HIGH, LabFlag.LOW],
        },
      },
      orderBy: { dateTaken: "desc" },
      take: 25,
    }),
  ]);

  const reminderItems: ReviewQueueItem[] = overdueReminders.map((item) => ({
    id: item.id,
    category: "OVERDUE_REMINDER",
    title: item.title,
    description: item.description ?? "Reminder is overdue and needs attention.",
    occurredAt: item.dueAt,
    href: "/reminders",
    tone: "warning",
  }));

  const missedItems: ReviewQueueItem[] = missedReminders.map((item) => ({
    id: item.id,
    category: "MISSED_REMINDER",
    title: item.title,
    description: item.description ?? "Reminder was missed and may require follow-up.",
    occurredAt: item.missedAt ?? item.dueAt,
    href: "/reminders",
    tone: "danger",
  }));

  const symptomItems: ReviewQueueItem[] = severeSymptoms.map((item) => ({
    id: item.id,
    category: "SEVERE_SYMPTOM",
    title: item.title,
    description: item.notes ?? `Severe symptom${item.bodyArea ? ` • ${item.bodyArea}` : ""}`,
    occurredAt: item.startedAt ?? item.createdAt,
    href: "/symptoms",
    tone: "danger",
  }));

  const labItems: ReviewQueueItem[] = abnormalLabs.map((item) => ({
    id: item.id,
    category: "ABNORMAL_LAB",
    title: `${item.testName} • ${item.flag}`,
    description: item.resultSummary || `Flagged lab result (${item.flag}).`,
    occurredAt: item.dateTaken,
    href: "/labs",
    tone: "danger",
  }));

  const items = [...reminderItems, ...missedItems, ...symptomItems, ...labItems].sort(
    (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
  );

  const stats = {
    overdueReminders: overdueReminders.length,
    missedReminders: missedReminders.length,
    severeSymptoms: severeSymptoms.length,
    abnormalLabs: abnormalLabs.length,
    total: items.length,
  };

  return {
    items,
    stats,
  };
}
