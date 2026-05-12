import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { AlertStatusForm } from "@/components/alerts/alert-status-form";
import { getAlertDetail } from "@/lib/alerts/queries";
import { describeAlertSource } from "@/lib/alerts/source";
import { buildAlertWorkflowCard } from "@/lib/alerts/workflow";
import { requireUser } from "@/lib/session";

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireUser();
  const { id } = await params;

  const alert = await getAlertDetail({
    userId: currentUser.id!,
    alertId: id,
  });

  if (!alert) {
    notFound();
  }

  const workflow = buildAlertWorkflowCard(alert);
  const statusClosed = ["RESOLVED", "DISMISSED"].includes(alert.status);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title={alert.title}
          description={alert.message}
          action={
            <Link
              href="/alerts"
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Back to alerts
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Alert overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={workflow.triage.tone}>{workflow.triage.label}</StatusPill>
                <StatusPill tone="neutral">{workflow.statusLabel}</StatusPill>
                <StatusPill tone={workflow.triage.tone}>{workflow.severityLabel}</StatusPill>
                <StatusPill tone="info">{workflow.categoryLabel}</StatusPill>
                <StatusPill tone={workflow.visibility.tone}>{workflow.visibility.label}</StatusPill>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/60 p-5">
                <p className="text-sm font-semibold">Workflow signal</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{workflow.triage.nextAction}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Age</p>
                    <p className="mt-1 text-sm font-semibold">{workflow.ageLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Visibility</p>
                    <p className="mt-1 text-sm font-semibold">{workflow.visibility.label}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Review state</p>
                    <p className="mt-1 text-sm font-semibold">{statusClosed ? "Closed" : "Actionable"}</p>
                  </div>
                </div>
              </div>

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Rule</dt>
                  <dd className="mt-1 font-medium">{alert.rule?.name ?? "System generated"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="mt-1 font-medium">{new Date(alert.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Source type</dt>
                  <dd className="mt-1 font-medium">{describeAlertSource(alert.sourceType)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Source recorded</dt>
                  <dd className="mt-1 font-medium">
                    {alert.sourceRecordedAt ? new Date(alert.sourceRecordedAt).toLocaleString() : "Not available"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Acknowledged</dt>
                  <dd className="mt-1 font-medium">
                    {alert.ownerAcknowledgedAt ? new Date(alert.ownerAcknowledgedAt).toLocaleString() : "Not yet"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Closed</dt>
                  <dd className="mt-1 font-medium">
                    {alert.resolvedAt
                      ? new Date(alert.resolvedAt).toLocaleString()
                      : alert.dismissedAt
                        ? new Date(alert.dismissedAt).toLocaleString()
                        : "Not closed"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-semibold">Linked source</p>
                <p className="mt-2 text-sm text-muted-foreground">{alert.sourceSummary ?? "No source summary available."}</p>
                {alert.sourceHref ? (
                  <Link href={alert.sourceHref} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
                    Open source record
                  </Link>
                ) : null}
              </div>

              {alert.contextJson ? (
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-sm font-semibold">Context payload</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">{alert.contextJson}</pre>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-sm font-semibold">Triage checklist</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {workflow.triage.checklist.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <AlertStatusForm alertId={alert.id} disabled={statusClosed} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alert.auditLogs.length ? (
                  alert.auditLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">{log.action}</div>
                          <div className="text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                        </div>
                        {log.actor ? (
                          <div className="text-xs text-muted-foreground">{log.actor.name ?? log.actor.email}</div>
                        ) : null}
                      </div>
                      {log.note ? <p className="mt-2 text-sm text-muted-foreground">{log.note}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No audit entries yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
