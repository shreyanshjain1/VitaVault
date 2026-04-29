import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Download,
  Filter,
  KeyRound,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { getSecurityAuditCenterData, parseAuditFilters, type SecurityAuditEvent } from "@/lib/audit-log";
import { requireUser } from "@/lib/session";

function formatDateTime(value: Date) {
  return new Date(value).toLocaleString();
}

function sourceLabel(source: SecurityAuditEvent["source"]) {
  const labels: Record<SecurityAuditEvent["source"], string> = {
    access: "Access",
    alert: "Alert",
    reminder: "Reminder",
    job: "Job",
    session: "Session",
  };
  return labels[source];
}

function sourceIcon(source: SecurityAuditEvent["source"]) {
  const classes = "h-4 w-4 text-muted-foreground";
  if (source === "access") return <ShieldCheck className={classes} />;
  if (source === "alert") return <AlertTriangle className={classes} />;
  if (source === "reminder") return <ClipboardList className={classes} />;
  if (source === "job") return <ServerCog className={classes} />;
  return <KeyRound className={classes} />;
}

function severityTone(severity: SecurityAuditEvent["severity"]) {
  if (severity === "danger") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  if (severity === "success") return "success" as const;
  return "info" as const;
}

function buildExportText(events: SecurityAuditEvent[]) {
  const header = ["Created At", "Source", "Severity", "Title", "Actor", "Owner", "Target", "Note"].join(",");
  const rows = events.map((event) =>
    [
      event.createdAt.toISOString(),
      sourceLabel(event.source),
      event.severity,
      event.title,
      event.actor,
      event.owner,
      event.target,
      event.note,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const user = await requireUser();
  const filters = parseAuditFilters(params);
  const data = await getSecurityAuditCenterData(
    { id: user.id!, role: user.role },
    filters
  );
  const exportText = buildExportText(data.events);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Audit Log"
          description="Review care access changes, alert/reminder audit trails, worker job activity, and mobile/API session events from one security-focused view."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/security"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-medium hover:bg-muted/50"
              >
                Security center
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                Job runs
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Visible events</CardTitle>
              <CardDescription>After current filters are applied.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold">{data.summary.totalEvents}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.isAdmin ? "Admin-wide operational visibility" : "Limited to your workspace"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>High risk</CardTitle>
              <CardDescription>Critical/failed events.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-4xl font-semibold">{data.summary.dangerEvents}</p></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Warnings</CardTitle>
              <CardDescription>Needs review.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-4xl font-semibold">{data.summary.warningEvents}</p></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open alerts</CardTitle>
              <CardDescription>Unresolved alert events.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-4xl font-semibold">{data.summary.openAlerts}</p></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Failed jobs</CardTitle>
              <CardDescription>Failed/retrying runs.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-4xl font-semibold">{data.summary.failedJobs}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Filter audit activity</CardTitle>
                <CardDescription className="mt-1">
                  Narrow by event source, severity, or free-text search across title, actor, owner, target, and notes.
                </CardDescription>
              </div>
              <form method="post" action={`data:text/csv;charset=utf-8,${encodeURIComponent(exportText)}`}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-medium hover:bg-muted/50"
                >
                  <Download className="h-4 w-4" />
                  Export visible CSV
                </button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]" action="/audit-log">
              <div className="space-y-2">
                <label htmlFor="q" className="text-sm font-medium">Search</label>
                <Input id="q" name="q" defaultValue={filters.q} placeholder="Search actions, actors, targets, or notes" />
              </div>
              <div className="space-y-2">
                <label htmlFor="source" className="text-sm font-medium">Source</label>
                <Select id="source" name="source" defaultValue={filters.source}>
                  <option value="all">All sources</option>
                  <option value="access">Access</option>
                  <option value="alert">Alert</option>
                  <option value="reminder">Reminder</option>
                  <option value="job">Job</option>
                  <option value="session">Session</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="severity" className="text-sm font-medium">Severity</label>
                <Select id="severity" name="severity" defaultValue={filters.severity}>
                  <option value="all">All severities</option>
                  <option value="danger">Danger</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="info">Info</option>
                </Select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 lg:w-auto"
                >
                  <Filter className="h-4 w-4" />
                  Apply filters
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Unified audit feed</CardTitle>
              <CardDescription>
                Most recent access, alert, reminder, job, and mobile session events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.events.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Event</TH>
                        <TH>Actor / Owner</TH>
                        <TH>Target</TH>
                        <TH>When</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {data.events.map((event) => (
                        <TR key={event.id}>
                          <TD>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="gap-2">{sourceIcon(event.source)}{sourceLabel(event.source)}</Badge>
                                <StatusPill tone={severityTone(event.severity)}>{event.severity}</StatusPill>
                              </div>
                              <div className="font-medium">{event.title}</div>
                              <div className="max-w-xl text-sm text-muted-foreground">{event.note}</div>
                            </div>
                          </TD>
                          <TD>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Actor:</span> {event.actor}</p>
                              <p><span className="text-muted-foreground">Owner:</span> {event.owner}</p>
                            </div>
                          </TD>
                          <TD className="max-w-xs text-sm text-muted-foreground">{event.target}</TD>
                          <TD className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(event.createdAt)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="No audit events found" description="Try clearing filters or generating activity through care access, alerts, reminders, mobile sessions, or jobs." />
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security posture</CardTitle>
                <CardDescription>What this audit center is tracking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-primary" /> Care access changes</div>
                  <p className="mt-1 text-muted-foreground">Invite, grant, revoke, and shared-access audit entries.</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alert and reminder actions</div>
                  <p className="mt-1 text-muted-foreground">Acknowledgements, resolutions, reminder state changes, and related notes.</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-2 font-medium"><Activity className="h-4 w-4 text-sky-500" /> Jobs and sessions</div>
                  <p className="mt-1 text-muted-foreground">Worker runs, failed attempts, active mobile sessions, expired tokens, and revocations.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active mobile sessions</CardTitle>
                <CardDescription>Current valid mobile/API tokens.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-semibold">{data.summary.activeMobileSessions}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage personal tokens from the Security Center. Admins can review aggregate visibility from this page.
                </p>
                <Link href="/security" className="mt-4 inline-flex rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50">
                  Open Security Center
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
