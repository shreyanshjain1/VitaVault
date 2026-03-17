import Link from "next/link";
import { BellRing, PlugZap, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function AlertsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Alert Center"
          description="This is the foundation for future threshold alerts, trend warnings, and caregiver escalation. It is intentionally safe and non-diagnostic."
          action={
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Back to dashboard
            </Link>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Monitoring timeline</CardTitle>
                  <CardDescription className="mt-1">
                    Upcoming alert rules and events will appear here with clear auditability.
                  </CardDescription>
                </div>
                <StatusPill tone="warning">Coming soon</StatusPill>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <p className="text-sm font-medium">No alert events yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  In Phase 2, this feed will show threshold crossings (e.g., BP, oxygen, sugar),
                  trend warnings, caregiver notifications, and escalation history.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <p className="text-sm font-medium">Event model direction</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Alert rules → alert events → caregiver notifications → escalation policy.
                  </p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <p className="text-sm font-medium">Safety and clarity</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Alerts will be informational and configurable; no emergency triage behavior.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phase 2 readiness</CardTitle>
              <CardDescription className="mt-1">
                This foundation is here so demos feel sponsor-ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BellRing className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Threshold alerts</p>
                  <p className="text-sm text-muted-foreground">
                    BP, oxygen saturation, glucose, temperature, weight change.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <PlugZap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Device feeds</p>
                  <p className="text-sm text-muted-foreground">
                    Apple Health / Health Connect / wearables (coming later).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Audit + access</p>
                  <p className="text-sm text-muted-foreground">
                    Every alert is attributable to a rule and a data source.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">
                  Note: Alerts will not diagnose or replace clinicians. This is a collaboration tool.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}