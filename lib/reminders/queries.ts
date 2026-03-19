import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function getReminderCenterData(args: {
  userId: string;
  state?: string;
  type?: string;
}) {
  const where: Prisma.ReminderWhereInput = {
    userId: args.userId,
    ...(args.state && args.state !== "ALL" ? { state: args.state as any } : {}),
    ...(args.type && args.type !== "ALL" ? { type: args.type as any } : {}),
  };

  const reminders = await db.reminder.findMany({
    where,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });

  const countsMap = reminders.reduce<Record<string, number>>((acc, reminder: any) => {
    const state = reminder.state ?? (reminder.completed ? "COMPLETED" : "DUE");
    acc[state] = (acc[state] ?? 0) + 1;
    return acc;
  }, {});

  const counts = Object.entries(countsMap).map(([state, count]) => ({
    state,
    count,
  }));

  return {
    reminders,
    counts,
  };
}