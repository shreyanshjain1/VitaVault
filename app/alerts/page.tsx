import Link from "next/link";
import { BellRing, CircleAlert, ShieldCheck, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
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

  const [alerts, rules] = await Promise.all([
    getAlertList({ userId: ownerUserId, status, severity, category }),
    getAlertRules(ownerUserId),
  ]);

  const openCount = alerts.filter((item) => item.status === "OPEN").length;
  const criticalCount = alerts.filter((item) => item.severity === "CRITICAL").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Alert Center"
          description="Threshold-based monitoring, worker-evaluated events, and patient/care-team visibility."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/timeline"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Open timeline
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Back to dashboard
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <Card>
            <CardHeader className="pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Threshold operations
              </p>
              <CardTitle className="text-3xl leading-tight">
                Rules, severity, and worker-backed monitoring
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Review active alert events, track critical issues, and manage a patient-safe monitoring workflow with source-linked auditability.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">Open alerts</p>
                  <BellRing className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{openCount}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">Critical severity</p>
                  <CircleAlert className="h-5 w-5 text-rose-500" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{criticalCount}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">Configured rules</p>
                  <Workflow className="h-5 w-5 text-sky-500" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{rules.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Care-team visibility</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Rules can expose alerts to collaborators when clinical follow-up matters.
                    </p>
                    <div className="mt-3">
                      <StatusPill tone="info">Owner view</StatusPill>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter and triage</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertFilterBar
              ownerUserId={ownerUserId}
              status={status}
              severity={severity}
              category={category}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <AlertList alerts={alerts} ownerUserId={ownerUserId} />
        </div>
      </div>
    </AppShell>
  );
}
