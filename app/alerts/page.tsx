import Link from "next/link";
import { BellRing, CircleAlert, ShieldCheck, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { requireOwnerAccess } from "@/lib/access";
import { getAlertList, getAlertRules } from "@/lib/alerts/queries";
import { AlertFilterBar } from "@/components/alerts/alert-filter-bar";
import { AlertList } from "@/components/alerts/alert-list";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUser();
  const params = (await searchParams) ?? {};
  const ownerUserId =
    typeof params.ownerUserId === "string" && params.ownerUserId
      ? params.ownerUserId
      : currentUser.id!;
  const status = typeof params.status === "string" ? params.status : "ALL";
  const severity = typeof params.severity === "string" ? params.severity : "ALL";
  const category = typeof params.category === "string" ? params.category : "ALL";

  const access = await requireOwnerAccess(currentUser.id!, ownerUserId, "alerts");

  const [alerts, rules] = await Promise.all([
    getAlertList({
      ownerUserId,
      actorUserId: currentUser.id!,
      isOwner: access.isOwner,
      status: status as never,
      severity: severity as never,
      category: category as never,
    }),
    access.isOwner ? getAlertRules(ownerUserId) : Promise.resolve([]),
  ]);

  const openCount = alerts.filter((item) => item.status === "OPEN").length;
  const criticalCount = alerts.filter((item) => item.severity === "CRITICAL").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Alert Center"
          description="Threshold-based monitoring, worker-evaluated events, and patient/care-team visibility."
          action={
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Open alerts</CardTitle>
              <BellRing className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{openCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Active issues awaiting acknowledgement, resolution, or dismissal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Critical severity</CardTitle>
              <CircleAlert className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{criticalCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Highest urgency items surfaced by configured rules.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Configured rules</CardTitle>
              <Workflow className="h-5 w-5 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{rules.length}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Enabled monitoring policies for vitals, symptoms, adherence, and sync health.
              </p>
            </CardContent>
          </Card>
        </div>

        <AlertFilterBar
          ownerUserId={ownerUserId}
          status={status}
          severity={severity}
          category={category}
        />

        <AlertList alerts={alerts} ownerUserId={ownerUserId} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Care-team visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Each rule and alert event can be visible or hidden from the care team.</p>
              <StatusPill tone="info">
                {access.isOwner ? "Owner view" : "Shared care-team view"}
              </StatusPill>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auditability</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Every status change and generated alert is stored with actor, timestamp, and metadata.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Worker-backed evaluation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              New records can enqueue alert evaluation immediately, while scheduled scans catch stale syncs and missed patterns.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
