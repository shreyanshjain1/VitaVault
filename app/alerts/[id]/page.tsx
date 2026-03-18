import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
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
      <div className="space-y-6">
        <PageHeader
          title={alert.title}
          description={alert.message}
          action={
            <Button asChild variant="outline">
              <Link href={`/alerts?ownerUserId=${ownerUserId}`}>Back to alerts</Link>
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
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
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="font-medium text-foreground">Rule</div>
                  <div className="text-muted-foreground">{alert.rule?.name ?? "Ad hoc / system-generated"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Source</div>
                  <div className="text-muted-foreground">
                    {alert.sourceType ? alertSourceLabel[alert.sourceType] ?? alert.sourceType : "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Source record id</div>
                  <div className="break-all text-muted-foreground">{alert.sourceId ?? "—"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Created</div>
                  <div className="text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Visible to care team</div>
                  <div className="text-muted-foreground">{alert.visibleToCareTeam ? "Yes" : "No"}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Status timestamps</div>
                  <div className="text-muted-foreground">
                    Ack: {alert.ownerAcknowledgedAt ? new Date(alert.ownerAcknowledgedAt).toLocaleString() : "—"}
                    <br />
                    Resolved: {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : "—"}
                    <br />
                    Dismissed: {alert.dismissedAt ? new Date(alert.dismissedAt).toLocaleString() : "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation context</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-2xl bg-muted/50 p-4 text-xs">
                  {JSON.stringify(parsedContext, null, 2)}
                </pre>
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
                      <div className="font-medium text-foreground">{log.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      {log.note ? (
                        <div className="mt-2 text-sm text-foreground">{log.note}</div>
                      ) : null}
                      {log.metadataJson ? (
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-muted/50 p-3 text-xs">
                          {JSON.stringify(JSON.parse(log.metadataJson), null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No audit entries yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Take action</CardTitle>
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
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>Name: {alert.rule.name}</div>
                  <div>Category: {alertCategoryLabel[alert.rule.category]}</div>
                  <div>Severity: {alertSeverityLabel[alert.rule.severity]}</div>
                  <div>Cooldown: {alert.rule.cooldownMinutes} minutes</div>
                  <div>Lookback: {alert.rule.lookbackHours} hours</div>
                  <div>Visible to care team: {alert.rule.visibleToCareTeam ? "Yes" : "No"}</div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
