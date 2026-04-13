import { BellRing, CalendarClock, CalendarSync, Clock3, Pill } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { ReminderChannel } from "@prisma/client";
import { requireUser } from "@/lib/session";
import { getReminderCenterData } from "@/lib/reminders/queries";
import {
  reminderStateLabel,
  reminderStateTone,
  reminderTypeLabel,
} from "@/lib/reminders/constants";
import {
  completeReminderAction,
  regenerateRemindersAction,
  skipReminderAction,
  snoozeReminderAction,
  updateReminderScheduleAction,
} from "./actions";

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date) {
  return new Date(date).toTimeString().slice(0, 5);
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};

  const state = typeof params.state === "string" ? params.state : "ALL";
  const type = typeof params.type === "string" ? params.type : "ALL";

  const data = await getReminderCenterData({
    userId: user.id!,
    state,
    type,
  });

  const overdueCount = data.reminders.filter((item) => item.state === "OVERDUE").length;
  const dueSoonCount = data.reminders.filter((item) => {
    const dueMs = new Date(item.dueAt).getTime();
    return dueMs >= Date.now() && dueMs - Date.now() <= 4 * 60 * 60 * 1000;
  }).length;

  const scheduledCount = data.reminders.filter(
    (item) => item.scheduleId || item.sourceType === "APPOINTMENT",
  ).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Reminder Center"
          description="Medication and appointment reminders with due-state tracking, snooze controls, regeneration tools, and editable schedule settings."
          action={
            <form action={regenerateRemindersAction} className="flex items-center gap-3">
              <input
                type="date"
                name="targetDate"
                defaultValue={toDateInputValue(new Date())}
                className="rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                Regenerate
              </button>
            </form>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Reminder workflow</CardTitle>
              <CardDescription className="mt-1">
                Due, sent, overdue, skipped, completed, and missed states are tracked here.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total reminders</p>
                  <BellRing className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{data.reminders.length}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Overdue now</p>
                  <Clock3 className="h-5 w-5 text-amber-500" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{overdueCount}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Due in 4 hours</p>
                  <CalendarSync className="h-5 w-5 text-sky-500" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{dueSoonCount}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Editable schedules</p>
                  <CalendarClock className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{scheduledCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>State counts</CardTitle>
              <CardDescription className="mt-1">
                Current reminder lifecycle distribution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.counts.length ? (
                data.counts.map((row) => (
                  <div
                    key={row.state}
                    className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/40 p-4"
                  >
                    <StatusPill tone={reminderStateTone(row.state)}>
                      {reminderStateLabel[row.state] ?? row.state}
                    </StatusPill>
                    <p className="text-lg font-semibold">{row.count}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  No reminder activity yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>In-app reminder center</CardTitle>
            <CardDescription className="mt-1">
              Review upcoming items, snooze them, or adjust due time, grace period, and delivery settings without regenerating the whole queue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.reminders.length ? (
              data.reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="rounded-3xl border border-border/60 bg-background/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{reminder.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {reminder.description ?? "No additional description."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={reminderStateTone(reminder.state ?? "DUE")}>
                        {reminderStateLabel[reminder.state ?? "DUE"] ?? reminder.state ?? "DUE"}
                      </StatusPill>
                      <StatusPill tone="neutral">
                        {reminderTypeLabel[reminder.type]}
                      </StatusPill>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <p>Due: {new Date(reminder.dueAt).toLocaleString()}</p>
                    <p>Channel: {reminder.channel ?? "IN_APP"}</p>
                    <p>Grace: {reminder.gracePeriodMinutes ?? 60} min</p>
                    <p>Timezone: {reminder.timezone || "Default"}</p>
                  </div>

                  {reminder.auditLogs[0] ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Latest activity: {reminder.auditLogs[0].action} •{" "}
                      {new Date(reminder.auditLogs[0].createdAt).toLocaleString()}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={completeReminderAction}>
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                      >
                        Complete
                      </button>
                    </form>

                    <form action={skipReminderAction}>
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                      >
                        Skip
                      </button>
                    </form>

                    <form action={snoozeReminderAction} className="flex items-center gap-2">
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <select
                        name="snoozeMinutes"
                        defaultValue="15"
                        className="rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                      >
                        <option value="15">Snooze 15m</option>
                        <option value="30">Snooze 30m</option>
                        <option value="60">Snooze 1h</option>
                        <option value="120">Snooze 2h</option>
                      </select>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                      >
                        Snooze
                      </button>
                    </form>
                  </div>

                  <details className="mt-4 rounded-3xl border border-border/60 bg-background/30 p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                      Edit schedule and delivery settings
                    </summary>
                    <form action={updateReminderScheduleAction} className="mt-4 grid gap-4 lg:grid-cols-6">
                      <input type="hidden" name="reminderId" value={reminder.id} />

                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Due date
                        </span>
                        <input
                          type="date"
                          name="dueDate"
                          defaultValue={toDateInputValue(new Date(reminder.dueAt))}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        />
                      </label>

                      <label className="space-y-2 lg:col-span-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Due time
                        </span>
                        <input
                          type="time"
                          name="dueTime"
                          defaultValue={toTimeInputValue(new Date(reminder.dueAt))}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        />
                      </label>

                      <label className="space-y-2 lg:col-span-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Grace mins
                        </span>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          name="gracePeriodMinutes"
                          defaultValue={reminder.gracePeriodMinutes ?? 60}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        />
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Channel
                        </span>
                        <select
                          name="channel"
                          defaultValue={reminder.channel ?? ReminderChannel.IN_APP}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        >
                          {Object.values(ReminderChannel).map((channel) => (
                            <option key={channel} value={channel}>
                              {channel.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Timezone
                        </span>
                        <input
                          type="text"
                          name="timezone"
                          defaultValue={reminder.timezone ?? "Asia/Manila"}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        />
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Quiet hours start
                        </span>
                        <input
                          type="time"
                          name="quietHoursStart"
                          defaultValue={reminder.quietHoursStart ?? "22:00"}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        />
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Quiet hours end
                        </span>
                        <input
                          type="time"
                          name="quietHoursEnd"
                          defaultValue={reminder.quietHoursEnd ?? "07:00"}
                          className="w-full rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
                        />
                      </label>

                      <div className="flex items-end lg:col-span-2">
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-medium hover:bg-muted/50"
                        >
                          Save schedule changes
                        </button>
                      </div>
                    </form>
                  </details>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-8 text-center text-sm text-muted-foreground">
                No reminders yet. Add medications or appointments to generate your reminder queue.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
