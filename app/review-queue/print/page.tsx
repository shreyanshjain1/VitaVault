import { AlertTriangle, BellRing, FlaskConical, Stethoscope } from "lucide-react";
import { AutoPrintOnLoad } from "@/components/auto-print-on-load";
import { PrintReviewQueueButton } from "@/components/print-review-queue-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
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

export default async function ReviewQueuePrintPage({
  searchParams,
}: {
  searchParams?: Promise<{ autoprint?: string }>;
}) {
  const user = await requireUser();
  const data = await getReviewQueueData(user.id!);
  const stats = data.stats;
  const params = (await searchParams) ?? {};
  const shouldAutoPrint = params.autoprint === "1";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 print:max-w-none print:p-0">
      {shouldAutoPrint ? <AutoPrintOnLoad /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Review queue export
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Operational follow-up summary</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Clean export view for handoff, case review, or saving as PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/review-queue"
            className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium transition hover:bg-muted/50"
          >
            Back to queue
          </a>
          <a
            href="/review-queue/print?autoprint=1"
            className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium transition hover:bg-muted/50"
          >
            Auto print view
          </a>
          <PrintReviewQueueButton />
        </div>
      </div>

      <div className="border-b border-border/60 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Review queue
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Operational follow-up summary</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated on {new Date().toLocaleString()} for active care follow-up.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <p className="text-4xl font-semibold">{stats.overdueReminders + stats.missedReminders}</p>
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
          <CardDescription>Printable queue snapshot across reminders, symptoms, and labs.</CardDescription>
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-border/60 bg-background/60`}>
                      {categoryLabel[item.category] ?? item.category}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-border/60 bg-background/60`}>
                      {item.tone === "success" ? "Healthy" : item.tone === "danger" ? "Attention" : item.tone === "warning" ? "Watch" : "Info"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <p>{new Date(item.occurredAt).toLocaleString()}</p>
                  <p>{item.href}</p>
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
  );
}
