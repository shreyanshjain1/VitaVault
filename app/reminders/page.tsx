import Link from "next/link";
import { BellRing, Pill, RefreshCcw, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getReminderCenterData } from "@/lib/reminders/queries";
import {
  reminderStateLabel,
  reminderStateTone,
  reminderTypeLabel,
} from "@/lib/reminders/constants";
import { completeReminderAction, regenerateReminderAction, skipReminderAction, snoozeReminderAction } from "./actions";

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

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Reminder Center"
          description="Medication and appointment reminders with due-state tracking, grace periods, and lifecycle updates."
          action={<Link href="/timeline" className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50">Open timeline</Link>}
        />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Reminder workflow</CardTitle>
              <CardDescription className="mt-1">
                Due, sent, overdue, skipped, completed, and missed states are tracked here.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Filtered reminders</p>
                  <BellRing className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{data.reminders.length}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Medication support</p>
                  <Pill className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-4 text-lg font-semibold">Schedule-derived</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Appointment support</p>
                  <Stethoscope className="h-5 w-5 text-sky-500" />
                </div>
                <p className="mt-4 text-lg font-semibold">Visit-aware</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>State counts</CardTitle>
              <CardDescription className="mt-1">Current reminder lifecycle distribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.counts.length ? (
                data.counts.map((row) => (
                  <div key={row.state} className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/40 p-4">
                    <StatusPill tone={reminderStateTone(row.state)}>
                      {reminderStateLabel[row.state] ?? row.state}
                    </StatusPill>
                    <p className="text-lg font-semibold">{row.count}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">No reminder activity yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters and generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <form className="grid gap-3 md:col-span-3 md:grid-cols-3">
                <Select name="state" defaultValue={state}>
                  <option value="ALL">All states</option>
                  {Object.entries(reminderStateLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                <Select name="type" defaultValue={type}>
                  <option value="ALL">All types</option>
                  {Object.entries(reminderTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                <Button type="submit">Apply filters</Button>
              </form>
              <div className="flex gap-2">
                <Link href="/reminders" className="inline-flex flex-1 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50">Reset</Link>
                <form action={regenerateReminderAction}>
                  <Button type="submit" variant="outline" className="gap-2"><RefreshCcw className="h-4 w-4" />Generate</Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In-app reminder center</CardTitle>
            <CardDescription className="mt-1">Review upcoming items and update reminder lifecycle state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.reminders.length ? (
              data.reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{reminder.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{reminder.description ?? "No additional description."}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={reminderStateTone(reminder.state ?? "DUE")}>
                        {reminderStateLabel[reminder.state ?? "DUE"] ?? reminder.state ?? "DUE"}
                      </StatusPill>
                      <StatusPill tone="neutral">
                        {reminderTypeLabel[reminder.type as keyof typeof reminderTypeLabel]}
                      </StatusPill>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <p>Due: {new Date(reminder.dueAt).toLocaleString()}</p>
                    <p>Channel: {reminder.channel ?? "IN_APP"}</p>
                    <p>Grace: {reminder.gracePeriodMinutes ?? 60} min</p>
                    <p>Timezone: {reminder.timezone || "Default"}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={completeReminderAction}>
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <Button type="submit">Complete</Button>
                    </form>

                    <form action={skipReminderAction}>
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <Button type="submit" variant="outline">Skip</Button>
                    </form>

                    <form action={snoozeReminderAction} className="flex items-center gap-2">
                      <input type="hidden" name="reminderId" value={reminder.id} />
                      <Select name="minutes" defaultValue="15" className="w-[130px]">
                        <option value="15">Snooze 15m</option>
                        <option value="30">Snooze 30m</option>
                        <option value="60">Snooze 1h</option>
                        <option value="180">Snooze 3h</option>
                      </Select>
                      <Button type="submit" variant="secondary">Snooze</Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">No reminders generated yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
