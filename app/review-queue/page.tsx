import { AlertTriangle, BellRing, FlaskConical, Stethoscope } from "lucide-react";
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
import { getReviewQueueData } from "@/lib/review-queue";

const toneClasses = {
  danger: "danger",
  warning: "warning",
  success: "success",
  info: "info",
  neutral: "neutral",
} as const;

const categoryLabel: Record<string, string> = {
  OVERDUE_REMINDER: "Overdue reminder",
  MISSED_REMINDER: "Missed reminder",
  SEVERE_SYMPTOM: "Severe symptom",
  ABNORMAL_LAB: "Abnormal lab",
};

export default async function ReviewQueuePage() {
  const user = await requireUser();
  const data = await getReviewQueueData(user.id!);
  const stats = data.stats;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Review Queue"
          description="Operational queue for overdue reminders, missed care tasks, severe symptoms, and abnormal labs."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total items</CardTitle>
              <CardDescription>All items needing follow-up.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-semibold">{stats.total}</p>
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminder issues</CardTitle>
              <CardDescription>Overdue plus missed reminders.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-semibold">
                  {stats.overdueReminders + stats.missedReminders}
                </p>
                <BellRing className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Severe symptoms</CardTitle>
              <CardDescription>Symptoms marked at the highest urgency.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-semibold">{stats.severeSymptoms}</p>
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Abnormal labs</CardTitle>
              <CardDescription>Flagged lab results requiring attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-semibold">{stats.abnormalLabs}</p>
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items needing follow-up</CardTitle>
            <CardDescription>
              Prioritized operational view across reminders, symptoms, and labs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.items.length ? (
              data.items.map((item) => (
                <div
                  key={`${item.category}-${item.id}`}
                  className="rounded-3xl border border-border/60 bg-background/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={toneClasses[item.tone] ?? "neutral"}>
                        {categoryLabel[item.category] ?? item.category}
                      </StatusPill>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <p>{new Date(item.occurredAt).toLocaleString()}</p>
                    <a
                      href={item.href}
                      className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                    >
                      Open record
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                No review items right now.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
