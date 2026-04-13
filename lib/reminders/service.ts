import { addDays, endOfDay, set, startOfDay } from "date-fns";
import { AppointmentStatus, ReminderType } from "@prisma/client";
import { db } from "@/lib/db";

function parseTimeOfDay(timeOfDay: string) {
  const [hoursRaw, minutesRaw] = timeOfDay.split(":");
  const hours = Number(hoursRaw ?? 0);
  const minutes = Number(minutesRaw ?? 0);

  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

async function createReminderAuditLog(args: {
  userId: string;
  reminderId?: string | null;
  actorUserId?: string | null;
  action: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await db.reminderAuditLog.create({
    data: {
      userId: args.userId,
      reminderId: args.reminderId ?? null,
      actorUserId: args.actorUserId ?? null,
      action: args.action,
      note: args.note ?? null,
      metadataJson: args.metadata ? JSON.stringify(args.metadata) : null,
    },
  });
}

export async function generateReminderInstances(args: {
  userId: string;
  targetDate?: Date;
  requestedByUserId?: string | null;
}) {
  const targetDate = args.targetDate ?? new Date();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  const [medications, appointments] = await Promise.all([
    db.medication.findMany({
      where: {
        userId: args.userId,
        active: true,
        status: "ACTIVE",
      },
      include: {
        schedules: true,
      },
    }),
    db.appointment.findMany({
      where: {
        userId: args.userId,
        status: AppointmentStatus.UPCOMING,
        scheduledAt: {
          gte: dayStart,
          lte: addDays(dayEnd, 7),
        },
      },
    }),
  ]);

  let created = 0;
  let deduped = 0;

  for (const medication of medications) {
    for (const schedule of medication.schedules) {
      const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);

      const dueAt = set(dayStart, {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0,
      });

      const dedupeKey = `medication:${args.userId}:${medication.id}:${schedule.id}:${dueAt
        .toISOString()
        .slice(0, 10)}`;

      const existing = await db.reminder.findFirst({
        where: {
          userId: args.userId,
          dedupeKey,
        } as any,
      });

      if (existing) {
        deduped += 1;
        continue;
      }

      const reminder = await db.reminder.create({
        data: {
          userId: args.userId,
          type: ReminderType.MEDICATION,
          title: `${medication.name} reminder`,
          description: `${medication.dosage} • ${medication.frequency}`,
          dueAt,
          completed: false,
          state: "DUE" as any,
          channel: "IN_APP" as any,
          gracePeriodMinutes: 60,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          timezone: "Asia/Manila",
          sourceType: "MEDICATION_SCHEDULE" as any,
          sourceId: medication.id,
          scheduleId: schedule.id,
          dedupeKey,
        } as any,
      });

      await createReminderAuditLog({
        userId: args.userId,
        actorUserId: args.requestedByUserId ?? null,
        reminderId: reminder.id,
        action: "reminder.created",
      });

      created += 1;
    }
  }

  for (const appointment of appointments) {
    const dedupeKey = `appointment:${args.userId}:${appointment.id}`;

    const existing = await db.reminder.findFirst({
      where: {
        userId: args.userId,
        dedupeKey,
      } as any,
    });

    if (existing) {
      deduped += 1;
      continue;
    }

    const reminder = await db.reminder.create({
      data: {
        userId: args.userId,
        type: ReminderType.APPOINTMENT,
        title: `Appointment: ${appointment.doctorName}`,
        description: `${appointment.clinic} • ${appointment.purpose}`,
        dueAt: appointment.scheduledAt,
        completed: false,
        state: "DUE" as any,
        channel: "IN_APP" as any,
        gracePeriodMinutes: 30,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        timezone: "Asia/Manila",
        sourceType: "APPOINTMENT" as any,
        sourceId: appointment.id,
        dedupeKey,
      } as any,
    });

    await createReminderAuditLog({
      userId: args.userId,
      actorUserId: args.requestedByUserId ?? null,
      reminderId: reminder.id,
      action: "reminder.created",
    });

    created += 1;
  }

  return { created, deduped };
}

export async function markDueRemindersAsOverdue(args: {
  userId: string;
  requestedByUserId?: string | null;
}) {
  const reminders = await db.reminder.findMany({
    where: {
      userId: args.userId,
      state: {
        in: ["DUE", "SENT"],
      },
    } as any,
  });

  let overdueMarked = 0;
  let missedMarked = 0;
  const now = new Date();

  for (const reminder of reminders as any[]) {
    const overdueAt = new Date(
      reminder.dueAt.getTime() + (reminder.gracePeriodMinutes ?? 0) * 60 * 1000
    );
    const missedAt = new Date(overdueAt.getTime() + 12 * 60 * 60 * 1000);

    if (now >= missedAt && reminder.state !== "MISSED") {
      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          state: "MISSED" as any,
          missedAt: now,
        } as any,
      });

      await createReminderAuditLog({
        userId: args.userId,
        actorUserId: args.requestedByUserId ?? null,
        reminderId: reminder.id,
        action: "reminder.missed",
      });

      missedMarked += 1;
      continue;
    }

    if (now >= overdueAt && reminder.state === "DUE") {
      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          state: "OVERDUE" as any,
          overdueAt: now,
        } as any,
      });

      await createReminderAuditLog({
        userId: args.userId,
        actorUserId: args.requestedByUserId ?? null,
        reminderId: reminder.id,
        action: "reminder.overdue",
      });

      overdueMarked += 1;
    }
  }

  return {
    overdueMarked,
    missedMarked,
  };
}

export async function updateReminderState(args: {
  userId: string;
  reminderId: string;
  nextState: string;
  actorUserId?: string | null;
  note?: string | null;
}) {
  const reminder = await db.reminder.findFirst({
    where: {
      id: args.reminderId,
      userId: args.userId,
    },
  });

  if (!reminder) {
    throw new Error("Reminder not found.");
  }

  const now = new Date();

  const updated = await db.reminder.update({
    where: { id: reminder.id },
    data: {
      state: args.nextState as any,
      completed: args.nextState === "COMPLETED" ? true : reminder.completed,
      completedAt: args.nextState === "COMPLETED" ? now : (reminder as any).completedAt,
      skippedAt: args.nextState === "SKIPPED" ? now : (reminder as any).skippedAt,
      sentAt: args.nextState === "SENT" ? now : (reminder as any).sentAt,
      overdueAt: args.nextState === "OVERDUE" ? now : (reminder as any).overdueAt,
      missedAt: args.nextState === "MISSED" ? now : (reminder as any).missedAt,
    } as any,
  });

  await createReminderAuditLog({
    userId: args.userId,
    actorUserId: args.actorUserId ?? null,
    reminderId: updated.id,
    action: `reminder.${args.nextState.toLowerCase()}`,
    note: args.note ?? null,
  });

  return updated;
}

export async function snoozeReminder(args: {
  userId: string;
  reminderId: string;
  minutes: number;
  actorUserId?: string | null;
}) {
  const reminder = await db.reminder.findFirst({
    where: {
      id: args.reminderId,
      userId: args.userId,
    },
  });

  if (!reminder) {
    throw new Error("Reminder not found.");
  }

  const nextDueAt = new Date(reminder.dueAt.getTime() + args.minutes * 60 * 1000);

  const updated = await db.reminder.update({
    where: { id: reminder.id },
    data: {
      dueAt: nextDueAt,
      state: "DUE" as any,
      overdueAt: null,
      missedAt: null,
      skippedAt: null,
    } as any,
  });

  await createReminderAuditLog({
    userId: args.userId,
    reminderId: reminder.id,
    actorUserId: args.actorUserId ?? null,
    action: "reminder.snoozed",
    metadata: {
      minutes: args.minutes,
      dueAt: nextDueAt.toISOString(),
    },
  });

  return updated;
}
