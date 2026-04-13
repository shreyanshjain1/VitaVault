import Link from "next/link";
import { AlertTriangle, BellRing, FlaskConical, ShieldAlert } from "lucide-react";
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

function categoryLabel(category: string) {
  switch (category) {
    case "OVERDUE_REMINDER":
      return "Overdue reminder";
    case "MISSED_REMINDER":
      return "Missed reminder";
    case "SEVERE_SYMPTOM":
      return "Severe symptom";
    case "ABNORMAL_LAB":
      return "Abnormal lab";
    default:
      return category;
  }
}

export default async function ReviewQueuePage() {
  const user = await requireUser();
  const data = await getReviewQueueData(user.id!);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Review Queue"
          description="Central queue for overdue reminders, severe symptoms, and flagged lab results that may need action."
          action={
            <Link
              href="/timeline"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
            >
              Open Timeline
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total queue</p>
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-4xl font-semibold">{data.summary.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Reminder risk</p>
                <BellRing className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-4 text-4xl font-semibold">
                {data.summary.overdueReminders + data.summary.missedReminders}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Severe symptoms</p>
                <ShieldAlert className="h-5 w-5 text-rose-500" />
              </div>
              <p className="mt-4 text-4xl font-semibold">{data.summary.severeSymptoms}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Abnormal labs</p>
                <FlaskConical className="h-5 w-5 text-sky-500" />
              </div>
              <p className="mt-4 text-4xl font-semibold">{data.summary.abnormalLabs}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Action queue</CardTitle>
            <CardDescription className="mt-1">
              Work through the most recent items that could require follow-up.
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <StatusPill tone={item.tone}>{categoryLabel(item.category)}</StatusPill>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>{new Date(item.occurredAt).toLocaleString()}</span>
                    <Link
                      href={item.href}
                      className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                    >
                      Open source module
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                The review queue is clear right now.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
