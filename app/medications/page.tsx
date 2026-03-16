import { endOfDay, startOfDay } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveMedication, logMedicationStatus } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

type DailyLogMap = Map<string, { status: string; loggedAt: Date }>;

function makeLogKey(medicationId: string, scheduleTime: string | null) {
  return `${medicationId}__${scheduleTime ?? "unscheduled"}`;
}

export default async function MedicationsPage() {
  const user = await requireUser();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [medications, doctors, logs, todayLogs] = await Promise.all([
    db.medication.findMany({
      where: { userId: user.id },
      include: { schedules: true, doctor: true },
      orderBy: { createdAt: "desc" },
    }),
    db.doctor.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    db.medicationLog.findMany({
      where: { userId: user.id },
      include: { medication: true },
      orderBy: { loggedAt: "desc" },
      take: 10,
    }),
    db.medicationLog.findMany({
      where: {
        userId: user.id,
        loggedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { loggedAt: "desc" },
    }),
  ]);

  const activeMedications = medications.filter(
    (medication) => medication.active && medication.status === "ACTIVE"
  );

  const scheduledDosesToday = activeMedications.reduce(
    (sum, medication) => sum + medication.schedules.length,
    0
  );

  const todayLogMap: DailyLogMap = new Map();
  for (const log of todayLogs) {
    const key = makeLogKey(log.medicationId, log.scheduleTime);
    if (!todayLogMap.has(key)) {
      todayLogMap.set(key, {
        status: log.status,
        loggedAt: log.loggedAt,
      });
    }
  }

  const takenToday = Array.from(todayLogMap.values()).filter(
    (log) => log.status === "TAKEN"
  ).length;

  const missedOrSkippedToday = Array.from(todayLogMap.values()).filter(
    (log) => log.status === "MISSED" || log.status === "SKIPPED"
  ).length;

  const adherencePercent =
    scheduledDosesToday > 0
      ? Math.round((takenToday / scheduledDosesToday) * 100)
      : 0;

  return (
    <AppShell>
      <PageHeader
        title="Medication Management"
        description="Track medications, schedules, status, instructions, and adherence."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active medications</p>
            <p className="mt-2 text-3xl font-semibold">
              {activeMedications.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Scheduled doses today</p>
            <p className="mt-2 text-3xl font-semibold">{scheduledDosesToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Taken today</p>
            <p className="mt-2 text-3xl font-semibold">{takenToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Adherence today</p>
            <p className="mt-2 text-3xl font-semibold">{adherencePercent}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {missedOrSkippedToday} missed or skipped
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add medication</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveMedication} className="grid gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input name="dosage" required />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Input name="frequency" required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Schedule time 1</Label>
                  <Input type="time" name="scheduleTimes" required />
                </div>
                <div className="space-y-2">
                  <Label>Schedule time 2</Label>
                  <Input type="time" name="scheduleTimes" />
                </div>
                <div className="space-y-2">
                  <Label>Schedule time 3</Label>
                  <Input type="time" name="scheduleTimes" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" name="startDate" required />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="date" name="endDate" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prescribing doctor</Label>
                <Select name="doctorId" defaultValue="">
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="ACTIVE">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked />
                Active
              </label>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea name="instructions" />
              </div>

              <Button>Add medication</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {medications.length ? (
            medications.map((medication) => (
              <Card key={medication.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{medication.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {medication.dosage} • {medication.frequency}
                      </p>
                    </div>
                    <Badge>{medication.status}</Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <p>
                      Schedule:{" "}
                      {medication.schedules.map((schedule) => schedule.timeOfDay).join(", ") ||
                        "—"}
                    </p>
                    <p>Doctor: {medication.doctor?.name ?? "—"}</p>
                    <p>Start: {formatDate(medication.startDate)}</p>
                    <p>End: {formatDate(medication.endDate)}</p>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {medication.instructions ?? "No instructions added."}
                  </p>

                  <div className="mt-4 space-y-3">
                    {medication.schedules.length ? (
                      medication.schedules.map((schedule) => {
                        const todayLog =
                          todayLogMap.get(
                            makeLogKey(medication.id, schedule.timeOfDay)
                          ) ?? null;

                        return (
                          <div
                            key={schedule.id}
                            className="rounded-2xl border p-4"
                          >
                            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-medium">
                                  Dose at {schedule.timeOfDay}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {todayLog
                                    ? `Latest update today: ${todayLog.status} • ${formatDateTime(
                                        todayLog.loggedAt
                                      )}`
                                    : "No status logged for this dose today yet."}
                                </p>
                              </div>
                              {todayLog ? <Badge>{todayLog.status}</Badge> : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <form
                                action={logMedicationStatus}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="medicationId"
                                  value={medication.id}
                                />
                                <input
                                  type="hidden"
                                  name="scheduleTime"
                                  value={schedule.timeOfDay}
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value="TAKEN"
                                />
                                <Button size="sm">Taken</Button>
                              </form>

                              <form
                                action={logMedicationStatus}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="medicationId"
                                  value={medication.id}
                                />
                                <input
                                  type="hidden"
                                  name="scheduleTime"
                                  value={schedule.timeOfDay}
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value="MISSED"
                                />
                                <Button size="sm" variant="outline">
                                  Missed
                                </Button>
                              </form>

                              <form
                                action={logMedicationStatus}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="medicationId"
                                  value={medication.id}
                                />
                                <input
                                  type="hidden"
                                  name="scheduleTime"
                                  value={schedule.timeOfDay}
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value="SKIPPED"
                                />
                                <Button size="sm" variant="secondary">
                                  Skipped
                                </Button>
                              </form>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                        No schedule times added for this medication.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No medications yet"
              description="Add your medication plan to begin adherence tracking."
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent adherence log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{log.medication.name}</p>
                      <Badge>{log.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Schedule: {log.scheduleTime ?? "—"}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDateTime(log.loggedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No adherence logs yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}