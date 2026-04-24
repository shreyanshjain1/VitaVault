import Link from "next/link";
import { redirect } from "next/navigation";
import { AppRole } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MailCheck,
  Shield,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { APP_ROLES } from "@/lib/domain/enums";
import { requireUser } from "@/lib/session";
import { getAdminWorkspaceData } from "@/lib/admin-dashboard";

type AdminWorkspaceData = Awaited<ReturnType<typeof getAdminWorkspaceData>>;
type UserRosterItem = AdminWorkspaceData["userRoster"][number];
type RecentUserItem = AdminWorkspaceData["recentUsers"][number];
type RecentInviteItem = AdminWorkspaceData["recentInvites"][number];
type AuditFeedItem = AdminWorkspaceData["auditFeed"][number];
type RecentJobRunItem = AdminWorkspaceData["recentJobRuns"][number];

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function roleTone(role: AppRole) {
  if (role === AppRole.ADMIN) return "danger" as const;
  if (role === AppRole.DOCTOR || role === AppRole.LAB_STAFF) return "info" as const;
  if (role === AppRole.CAREGIVER) return "warning" as const;
  return "neutral" as const;
}

function statusTone(status: string) {
  if (["FAILED", "REVOKED", "DECLINED", "EXPIRED"].includes(status)) return "danger" as const;
  if (["PENDING", "RETRYING", "ERROR"].includes(status)) return "warning" as const;
  if (["OPEN", "ACTIVE"].includes(status)) return "info" as const;
  if (["COMPLETED", "RESOLVED", "VERIFIED"].includes(status)) return "success" as const;
  return "neutral" as const;
}

function sourceTone(source: "ACCESS" | "ALERT" | "REMINDER") {
  if (source === "ALERT") return "danger" as const;
  if (source === "REMINDER") return "warning" as const;
  return "info" as const;
}

function StatCard({ title, value, description, icon }: { title: string; value: number; description: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-2">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  const user = await requireUser();

  if (user.role !== APP_ROLES.ADMIN) {
    redirect("/dashboard");
  }

  const data = await getAdminWorkspaceData();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Admin Workspace"
          description="Review user growth, invite pressure, audit activity, and operational risk from one business-facing control surface."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/ops" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Operations</Link>
              <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Job runs</Link>
              <Link href="/security" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Security</Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total users" value={data.summary.totalUsers} description="All accounts currently provisioned inside VitaVault." icon={<Users className="h-5 w-5 text-primary" />} />
          <StatCard title="Verified users" value={data.summary.verifiedUsers} description="Accounts that have completed email verification." icon={<MailCheck className="h-5 w-5 text-emerald-500" />} />
          <StatCard title="Pending invites" value={data.summary.pendingInvites} description="Outstanding care-team invitations awaiting action." icon={<UserPlus className="h-5 w-5 text-violet-500" />} />
          <StatCard title="Admin accounts" value={data.summary.adminUsers} description="Accounts with full administrative visibility and controls." icon={<UserCog className="h-5 w-5 text-rose-500" />} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Active care access" value={data.summary.activeCareAccess} description="Currently active care relationships across the system." icon={<Shield className="h-5 w-5 text-sky-500" />} />
          <StatCard title="Open alerts" value={data.summary.openAlerts} description="Alert events still waiting for review or resolution." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Failed jobs" value={data.summary.failedJobs} description="Queue runs stuck in failed or retrying status." icon={<Cpu className="h-5 w-5 text-orange-500" />} />
          <StatCard title="Active mobile sessions" value={data.summary.activeMobileSessions} description="Non-revoked API or mobile sessions still valid right now." icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>User roster snapshot</CardTitle>
              <CardDescription>Recent accounts with role, verification, and feature-footprint visibility.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>User</TH>
                      <TH>Role</TH>
                      <TH>Verification</TH>
                      <TH>Footprint</TH>
                      <TH>Created</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.userRoster.map((item: UserRosterItem) => (
                      <TR key={item.id}>
                        <TD>
                          <div className="space-y-1">
                            <div className="font-medium">{item.name || "Unnamed user"}</div>
                            <div className="text-xs text-muted-foreground">{item.email}</div>
                          </div>
                        </TD>
                        <TD>
                          <StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill>
                        </TD>
                        <TD>
                          <StatusPill tone={item.emailVerified ? "success" : "warning"}>
                            {item.emailVerified ? "Verified" : "Pending"}
                          </StatusPill>
                        </TD>
                        <TD>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge>{item._count.reminders} reminders</Badge>
                            <Badge>{item._count.alertEvents} alerts</Badge>
                            <Badge>{item._count.documents} docs</Badge>
                            <Badge>{item._count.mobileSessionTokens} tokens</Badge>
                          </div>
                        </TD>
                        <TD className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent account creation</CardTitle>
                <CardDescription>Newest users entering the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentUsers.length ? data.recentUsers.map((item: RecentUserItem) => (
                  <div key={item.id} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill>
                      <StatusPill tone={item.emailVerified ? "success" : "warning"}>{item.emailVerified ? "Verified" : "Pending"}</StatusPill>
                    </div>
                    <div className="mt-3">
                      <div className="font-medium">{item.name || "Unnamed user"}</div>
                      <div className="text-sm text-muted-foreground">{item.email}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Created: {formatDateTime(item.createdAt)}</div>
                    </div>
                  </div>
                )) : <EmptyState title="No users yet" description="User onboarding activity will appear here once accounts are created." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending invite queue</CardTitle>
                <CardDescription>Latest care-team invites that still need action.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentInvites.length ? data.recentInvites.map((invite: RecentInviteItem) => (
                  <div key={invite.id} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={statusTone(invite.status)}>{invite.status}</StatusPill>
                      <Badge>{invite.accessRole}</Badge>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="font-medium">{invite.email}</div>
                      <div className="text-sm text-muted-foreground">Owner: {invite.owner.name || invite.owner.email}</div>
                      <div className="text-sm text-muted-foreground">Granted by: {invite.grantedBy.name || invite.grantedBy.email}</div>
                      <div className="text-sm text-muted-foreground">Created: {formatDateTime(invite.createdAt)}</div>
                      <div className="text-sm text-muted-foreground">Expires: {formatDateTime(invite.expiresAt)}</div>
                    </div>
                  </div>
                )) : <EmptyState title="No invites pending" description="Pending care invite activity will show up here for quick admin review." />}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Audit review feed</CardTitle>
              <CardDescription>Combined access, alert, and reminder actions across the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.auditFeed.length ? data.auditFeed.map((item: AuditFeedItem) => (
                <div key={item.id} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={sourceTone(item.source)}>{item.source}</StatusPill>
                    <Badge>{item.action}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div><span className="font-medium">Owner:</span> <span className="text-muted-foreground">{item.ownerLabel}</span></div>
                    <div><span className="font-medium">Actor:</span> <span className="text-muted-foreground">{item.actorLabel}</span></div>
                    <div><span className="font-medium">Target:</span> <span className="text-muted-foreground">{item.targetLabel}</span></div>
                    <div><span className="font-medium">When:</span> <span className="text-muted-foreground">{formatDateTime(item.createdAt)}</span></div>
                  </div>
                  {item.note ? (
                    <div className="mt-3 rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                      {item.note}
                    </div>
                  ) : null}
                </div>
              )) : <EmptyState title="No audit entries yet" description="Admin review feed will populate as users, alerts, and reminders generate activity." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent job pressure</CardTitle>
              <CardDescription>Most recent queue activity for triage and operational follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentJobRuns.length ? data.recentJobRuns.map((run: RecentJobRunItem) => (
                <div key={run.id} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{run.jobKind.replaceAll("_", " ")}</Badge>
                    <StatusPill tone={statusTone(run.status)}>{run.status}</StatusPill>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="font-medium">{run.jobName}</div>
                    <div className="text-sm text-muted-foreground">Queue: {run.queueName}</div>
                    <div className="text-sm text-muted-foreground">Actor: {run.user?.name || run.user?.email || "System"}</div>
                    <div className="text-sm text-muted-foreground">Created: {formatDateTime(run.createdAt)}</div>
                  </div>
                  {run.errorMessage ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                      {run.errorMessage}
                    </div>
                  ) : null}
                </div>
              )) : <EmptyState title="No job pressure right now" description="Recent background-job pressure will appear here once queue work begins flowing." />}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
