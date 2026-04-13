import { BellRing, CalendarSync, Clock3, Pill, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
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
} from "./actions";

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
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

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Reminder Center"
          description="Medication and appointment reminders with due-state tracking, snooze controls, and regeneration tools."
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
                  <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                  <Pill className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-4 text-lg font-semibold">Medication + appointment</p>
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
              Review upcoming items, snooze them, or update reminder lifecycle state.
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

                    {reminder.type === "APPOINTMENT" ? (
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Visit-aware reminder
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                No reminders generated yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
