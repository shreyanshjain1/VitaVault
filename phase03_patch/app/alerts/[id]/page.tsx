import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { AlertStatusForm } from "@/components/alerts/alert-status-form";
import {
  alertCategoryLabel,
  alertSeverityLabel,
  alertSourceLabel,
  alertStatusLabel,
} from "@/lib/alerts/constants";
import { getAlertDetail } from "@/lib/alerts/queries";
import { requireOwnerAccess } from "@/lib/access";
import { requireUser } from "@/lib/session";

function formatDateTime(value?: Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function AlertDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUser();
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const ownerUserId =
    typeof query.ownerUserId === "string" && query.ownerUserId
      ? query.ownerUserId
      : currentUser.id!;

  await requireOwnerAccess(currentUser.id!, ownerUserId, "alerts");

  const alert = await getAlertDetail({
    alertId: id,
    ownerUserId,
  });

  if (!alert) {
    notFound();
  }

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

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Alert summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="neutral">{alertStatusLabel[alert.status] ?? alert.status}</StatusPill>
                <StatusPill tone="info">{alertSeverityLabel[alert.severity] ?? alert.severity}</StatusPill>
                <StatusPill tone="warning">{alertCategoryLabel[alert.category] ?? alert.category}</StatusPill>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rule</dt>
                  <dd className="mt-2 text-sm font-medium">{alert.rule?.name ?? "System generated"}</dd>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Source</dt>
                  <dd className="mt-2 text-sm font-medium">{alertSourceLabel[alert.sourceType ?? ""] ?? alert.sourceType ?? "Unknown"}</dd>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Created</dt>
                  <dd className="mt-2 text-sm font-medium">{formatDateTime(alert.createdAt)}</dd>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Source record ID</dt>
                  <dd className="mt-2 break-all text-sm font-medium">{alert.sourceId ?? "—"}</dd>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Acknowledged</dt>
                  <dd className="mt-2 text-sm font-medium">{formatDateTime(alert.ownerAcknowledgedAt)}</dd>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Resolved</dt>
                  <dd className="mt-2 text-sm font-medium">{formatDateTime(alert.resolvedAt)}</dd>
                </div>
              </dl>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Context JSON</div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {alert.contextJson ?? "No extra context attached."}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertStatusForm alertId={alert.id} ownerUserId={ownerUserId} />
              </CardContent>
            </Card>

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
                      <div className="font-medium text-foreground">{log.action}</div>
                      {log.note ? (
                        <div className="mt-1 text-sm text-muted-foreground">{log.note}</div>
                      ) : null}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
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
