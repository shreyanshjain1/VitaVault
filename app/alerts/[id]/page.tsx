import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { requireOwnerAccess } from "@/lib/access";
import { getAlertDetail } from "@/lib/alerts/queries";
import {
  alertCategoryLabel,
  alertSeverityLabel,
  alertSourceLabel,
  alertStatusLabel,
} from "@/lib/alerts/constants";
import { AlertStatusForm } from "@/components/alerts/alert-status-form";

function toneForSeverity(severity: string) {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
  return "neutral";
}

function toneForStatus(status: string) {
  if (status === "OPEN") return "danger";
  if (status === "ACKNOWLEDGED") return "warning";
  if (status === "RESOLVED") return "success";
  return "neutral";
}

export default async function AlertDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUser();
  const routeParams = await params;
  const query = (await searchParams) ?? {};
  const ownerUserId =
    typeof query.ownerUserId === "string" && query.ownerUserId
      ? query.ownerUserId
      : currentUser.id!;

  const access = await requireOwnerAccess(currentUser.id!, ownerUserId, "alerts");

  const alert = await getAlertDetail({
    ownerUserId,
    isOwner: access.isOwner,
    alertId: routeParams.id,
  });

  if (!alert) {
    notFound();
  }

  const parsedContext = alert.contextJson ? JSON.parse(alert.contextJson) : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title={alert.title}
          description={alert.message}
          action={
            <Link
              href={`/alerts?ownerUserId=${ownerUserId}`}
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Back to alerts
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={toneForSeverity(alert.severity)}>
                    {alertSeverityLabel[alert.severity]}
                  </StatusPill>
                  <StatusPill tone={toneForStatus(alert.status)}>
                    {alertStatusLabel[alert.status]}
                  </StatusPill>
                  <StatusPill tone="neutral">
                    {alertCategoryLabel[alert.category]}
                  </StatusPill>
                </div>
                <CardDescription className="mt-2">
                  Source-linked alert event details and lifecycle timestamps.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rule</p>
                  <p className="mt-2 text-sm font-semibold">
                    {alert.rule?.name ?? "Ad hoc / system-generated"}
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                  <p className="mt-2 text-sm font-semibold">
                    {alert.sourceType
                      ? alertSourceLabel[alert.sourceType] ?? alert.sourceType
                      : "Unknown"}
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Source record id
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold">
                    {alert.sourceId ?? "—"}
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                  <p className="mt-2 text-sm font-semibold">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Visible to care team
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {alert.visibleToCareTeam ? "Yes" : "No"}
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Status timestamps
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>
                      Ack:{" "}
                      {alert.ownerAcknowledgedAt
                        ? new Date(alert.ownerAcknowledgedAt).toLocaleString()
                        : "—"}
                    </p>
                    <p>
                      Resolved:{" "}
                      {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : "—"}
                    </p>
                    <p>
                      Dismissed:{" "}
                      {alert.dismissedAt
                        ? new Date(alert.dismissedAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation context</CardTitle>
                <CardDescription className="mt-1">
                  Structured context captured at the time this alert was materialized.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-3xl border border-border/60 bg-background/40 p-5 text-xs leading-6">
                  {JSON.stringify(parsedContext, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit trail</CardTitle>
                <CardDescription className="mt-1">
                  Lifecycle events recorded for this alert.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alert.auditLogs.length ? (
                  alert.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-3xl border border-border/60 bg-background/40 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {log.note ? (
                        <p className="mt-3 text-sm text-foreground">{log.note}</p>
                      ) : null}

                      {log.metadataJson ? (
                        <pre className="mt-4 overflow-x-auto rounded-2xl bg-muted/50 p-4 text-xs leading-6">
                          {JSON.stringify(JSON.parse(log.metadataJson), null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                    No audit entries yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Take action</CardTitle>
                <CardDescription className="mt-1">
                  Update the current alert lifecycle status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertStatusForm
                  alertId={alert.id}
                  ownerUserId={ownerUserId}
                  disabled={alert.status === "RESOLVED" || alert.status === "DISMISSED"}
                />
              </CardContent>
            </Card>

            {alert.rule ? (
              <Card>
                <CardHeader>
                  <CardTitle>Rule settings snapshot</CardTitle>
                  <CardDescription className="mt-1">
                    Configuration values from the rule that generated this alert.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm">
                    <p className="font-semibold">Name</p>
                    <p className="mt-1 text-muted-foreground">{alert.rule.name}</p>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm">
                    <p className="font-semibold">Category</p>
                    <p className="mt-1 text-muted-foreground">
                      {alertCategoryLabel[alert.rule.category]}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm">
                    <p className="font-semibold">Severity</p>
                    <p className="mt-1 text-muted-foreground">
                      {alertSeverityLabel[alert.rule.severity]}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm">
                    <p className="font-semibold">Cooldown</p>
                    <p className="mt-1 text-muted-foreground">
                      {alert.rule.cooldownMinutes} minutes
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm">
                    <p className="font-semibold">Lookback window</p>
                    <p className="mt-1 text-muted-foreground">
                      {alert.rule.lookbackHours} hours
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm">
                    <p className="font-semibold">Care-team visibility</p>
                    <p className="mt-1 text-muted-foreground">
                      {alert.rule.visibleToCareTeam ? "Yes" : "No"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}