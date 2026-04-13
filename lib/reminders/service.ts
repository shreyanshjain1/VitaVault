import { addDays, endOfDay, set, startOfDay } from "date-fns";
import { AppointmentStatus, ReminderState, ReminderType } from "@prisma/client";
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
        },
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
          state: ReminderState.DUE,
          channel: "IN_APP",
          gracePeriodMinutes: 60,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          timezone: "Asia/Manila",
          sourceType: "MEDICATION_SCHEDULE",
          sourceId: medication.id,
          scheduleId: schedule.id,
          dedupeKey,
        },
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
      },
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
        state: ReminderState.DUE,
        channel: "IN_APP",
        gracePeriodMinutes: 30,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        timezone: "Asia/Manila",
        sourceType: "APPOINTMENT",
        sourceId: appointment.id,
        dedupeKey,
      },
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
        in: [ReminderState.DUE, ReminderState.SENT],
      },
    },
  });

  let overdueMarked = 0;
  let missedMarked = 0;
  const now = new Date();

  for (const reminder of reminders) {
    const overdueAt = new Date(
      reminder.dueAt.getTime() + (reminder.gracePeriodMinutes ?? 0) * 60 * 1000,
    );
    const missedAt = new Date(overdueAt.getTime() + 12 * 60 * 60 * 1000);

    if (now >= missedAt && reminder.state !== ReminderState.MISSED) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          state: ReminderState.MISSED,
          missedAt: now,
        },
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

    if (now >= overdueAt && reminder.state === ReminderState.DUE) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          state: ReminderState.OVERDUE,
          overdueAt: now,
        },
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
  nextState: ReminderState | `${ReminderState}`;
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

  const nextState = args.nextState as ReminderState;
  const now = new Date();

  const updated = await db.reminder.update({
    where: { id: reminder.id },
    data: {
      state: nextState,
      completed: nextState === ReminderState.COMPLETED ? true : reminder.completed,
      completedAt:
        nextState === ReminderState.COMPLETED ? now : reminder.completedAt,
      skippedAt: nextState === ReminderState.SKIPPED ? now : reminder.skippedAt,
      sentAt: nextState === ReminderState.SENT ? now : reminder.sentAt,
      overdueAt: nextState === ReminderState.OVERDUE ? now : reminder.overdueAt,
      missedAt: nextState === ReminderState.MISSED ? now : reminder.missedAt,
    },
  });

  await createReminderAuditLog({
    userId: args.userId,
    actorUserId: args.actorUserId ?? null,
    reminderId: updated.id,
    action: `reminder.${String(nextState).toLowerCase()}`,
    note: args.note ?? null,
  });

  return updated;
}

export async function snoozeReminder(args: {
  userId: string;
  reminderId: string;
  minutes?: number;
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

  const terminalStates: ReminderState[] = [
    ReminderState.COMPLETED,
    ReminderState.SKIPPED,
    ReminderState.MISSED,
  ];

  if (terminalStates.includes(reminder.state)) {
    throw new Error("Completed, skipped, or missed reminders cannot be snoozed.");
  }

  const minutes = Number.isFinite(args.minutes) ? Math.max(5, Number(args.minutes)) : 15;
  const dueAt = new Date(reminder.dueAt.getTime() + minutes * 60 * 1000);

  const updated = await db.reminder.update({
    where: { id: reminder.id },
    data: {
      dueAt,
      state: ReminderState.DUE,
      overdueAt: null,
      sentAt: null,
      missedAt: null,
    },
  });

  await createReminderAuditLog({
    userId: args.userId,
    actorUserId: args.actorUserId ?? null,
    reminderId: updated.id,
    action: "reminder.snoozed",
    note: args.note ?? null,
    metadata: { minutes, dueAt: dueAt.toISOString() },
  });

  return updated;
}

export async function regenerateRemindersForDate(args: {
  userId: string;
  targetDate?: Date;
  actorUserId?: string | null;
}) {
  const result = await generateReminderInstances({
    userId: args.userId,
    targetDate: args.targetDate,
    requestedByUserId: args.actorUserId ?? null,
  });

  await createReminderAuditLog({
    userId: args.userId,
    actorUserId: args.actorUserId ?? null,
    action: "reminder.regenerated",
    metadata: {
      targetDate: (args.targetDate ?? new Date()).toISOString(),
      created: result.created,
      deduped: result.deduped,
    },
  });

  return result;
}
