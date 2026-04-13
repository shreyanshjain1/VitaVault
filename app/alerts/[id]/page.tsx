import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { AlertStatusForm } from "@/components/alerts/alert-status-form";
import { requireUser } from "@/lib/session";
import { getAlertDetail } from "@/lib/alerts/queries";
import { alertCategoryLabel, alertSeverityLabel, alertSourceLabel, alertStatusLabel } from "@/lib/alerts/constants";

function toneForSeverity(severity: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
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
  const route = await params;
  const query = (await searchParams) ?? {};
  const ownerUserId =
    typeof query.ownerUserId === "string" && query.ownerUserId
      ? query.ownerUserId
      : currentUser.id!;

  const alert = await getAlertDetail({ userId: ownerUserId, alertId: route.id });
  if (!alert) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title={alert.title}
          description={alert.message}
          action={
            <div className="flex flex-wrap gap-3">
              {alert.sourceHref ? (
                <Link
                  href={alert.sourceHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  Open source module
                </Link>
              ) : null}
              <Link
                href={`/alerts?ownerUserId=${ownerUserId}`}
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Back to alerts
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Alert summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="neutral">{alertStatusLabel[alert.status] ?? alert.status}</StatusPill>
                <StatusPill tone={toneForSeverity(alert.severity)}>{alertSeverityLabel[alert.severity] ?? alert.severity}</StatusPill>
                <StatusPill tone="info">{alertCategoryLabel[alert.category] ?? alert.category}</StatusPill>
                {alert.visibleToCareTeam ? <StatusPill tone="success">Care-team visible</StatusPill> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rule</p>
                  <p className="mt-2 text-sm font-medium">{alert.rule?.name ?? "System generated"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</p>
                  <p className="mt-2 text-sm font-medium">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
                  <p className="mt-2 text-sm font-medium">{alertSourceLabel[alert.sourceType ?? ""] ?? alert.sourceType ?? "Unknown source"}</p>
                  {alert.sourceSummary ? (
                    <p className="mt-2 text-sm text-muted-foreground">{alert.sourceSummary}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change status</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertStatusForm alertId={alert.id} ownerUserId={ownerUserId} disabled={alert.status === "RESOLVED" || alert.status === "DISMISSED"} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alert.auditLogs.length ? (
              alert.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">{log.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {log.actorUser ? (
                      <StatusPill tone="neutral">{log.actorUser.name ?? log.actorUser.email ?? "User action"}</StatusPill>
                    ) : null}
                  </div>
                  {log.note ? <div className="mt-2 text-sm text-muted-foreground">{log.note}</div> : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No audit entries yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
