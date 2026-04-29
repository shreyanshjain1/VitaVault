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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { APP_ROLES } from "@/lib/domain/enums";
import { requireUser } from "@/lib/session";
import { getAdminWorkspaceData } from "@/lib/admin-dashboard";
import { resendVerificationForUserAction, revokeUserMobileSessionsAction } from "./actions";
import { isEmailDeliveryConfigured } from "@/lib/account-email";

type AdminWorkspaceData = Awaited<ReturnType<typeof getAdminWorkspaceData>>;
type UserRosterItem = AdminWorkspaceData["userRoster"][number];
type RecentInviteItem = AdminWorkspaceData["recentInvites"][number];
type AuditFeedItem = AdminWorkspaceData["auditFeed"][number];
type RecentJobRunItem = AdminWorkspaceData["recentJobRuns"][number];

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function AdminUserActions({ item, emailEnabled }: { item: UserRosterItem; emailEnabled: boolean }) {
  return (
    <div className="space-y-2">
      <form action={revokeUserMobileSessionsAction}>
        <input type="hidden" name="userId" value={item.id} />
        <Button type="submit" size="sm" variant="outline">Revoke sessions</Button>
      </form>

      {!item.emailVerified ? (
        <form action={resendVerificationForUserAction}>
          <input type="hidden" name="userId" value={item.id} />
          <Button type="submit" size="sm" variant="secondary" disabled={!emailEnabled}>Resend verification</Button>
        </form>
      ) : null}
    </div>
  );
}

function AuditCard({ item }: { item: AuditFeedItem }) {
  return (
    <div className="rounded-3xl border border-border/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={sourceTone(item.source)}>{item.source}</StatusPill>
        <Badge>{item.action}</Badge>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <div className="font-medium">{item.targetLabel}</div>
        <div className="text-muted-foreground">Owner: {item.ownerLabel}</div>
        <div className="text-muted-foreground">Actor: {item.actorLabel}</div>
        {item.note ? <div className="text-muted-foreground">{item.note}</div> : null}
        <div className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
      </div>
    </div>
  );
}

function RecentInviteCard({ invite }: { invite: RecentInviteItem }) {
  return (
    <div className="rounded-3xl border border-border/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={statusTone(invite.status)}>{invite.status}</StatusPill>
        <Badge>{invite.accessRole}</Badge>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <div className="font-medium">{invite.email}</div>
        <div className="text-muted-foreground">Owner: {invite.owner.name || invite.owner.email || invite.owner.id}</div>
        <div className="text-muted-foreground">Granted by: {invite.grantedBy.name || invite.grantedBy.email || invite.grantedBy.id}</div>
        <div className="text-xs text-muted-foreground">Sent {formatDateTime(invite.createdAt)} • Expires {formatDateTime(invite.expiresAt)}</div>
      </div>
    </div>
  );
}

function JobRunCard({ run }: { run: RecentJobRunItem }) {
  return (
    <div className="rounded-3xl border border-border/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={statusTone(run.status)}>{run.status}</StatusPill>
        <Badge>{run.jobKind}</Badge>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <div className="font-medium">{run.jobName}</div>
        <div className="text-muted-foreground">Queue: {run.queueName}</div>
        <div className="text-muted-foreground">User: {run.user?.name || run.user?.email || "System"}</div>
        {run.errorMessage ? <div className="text-destructive">{run.errorMessage}</div> : null}
        <div className="text-xs text-muted-foreground">{formatDateTime(run.createdAt)}</div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== APP_ROLES.ADMIN) redirect("/dashboard");

  const data = await getAdminWorkspaceData();
  const emailEnabled = isEmailDeliveryConfigured();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Admin Command Center"
          description="Review account growth, verification status, care access, alerts, background jobs, and audited workflow activity from one business-facing control surface."
          action={<div className="flex flex-wrap gap-2">
            <Link href="/ops" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Operations</Link>
            <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Job runs</Link>
            <Link href="/security" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Security</Link>
          </div>}
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

        <Card>
          <CardHeader>
            <CardTitle>Verification readiness</CardTitle>
            <CardDescription>{data.summary.verificationRate}% of accounts have completed email verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar value={data.summary.verificationRate} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>User roster snapshot</CardTitle>
              <CardDescription>Recent accounts with role, verification status, record footprint, and safe admin actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>User</TH>
                      <TH>Role</TH>
                      <TH>Status</TH>
                      <TH>Footprint</TH>
                      <TH>Created</TH>
                      <TH>Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.userRoster.length ? data.userRoster.map((item: UserRosterItem) => (
                      <TR key={item.id}>
                        <TD>
                          <div className="font-medium">{item.name || "Unnamed user"}</div>
                          <div className="text-xs text-muted-foreground">{item.email}</div>
                        </TD>
                        <TD><StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill></TD>
                        <TD><StatusPill tone={item.emailVerified ? "success" : "warning"}>{item.emailVerified ? "Verified" : "Needs verification"}</StatusPill></TD>
                        <TD>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>{item._count.documents} documents</div>
                            <div>{item._count.alertEvents} alerts</div>
                            <div>{item._count.reminders} reminders</div>
                            <div>{item._count.mobileSessionTokens} mobile sessions</div>
                          </div>
                        </TD>
                        <TD>{formatDateTime(item.createdAt)}</TD>
                        <TD><AdminUserActions item={item} emailEnabled={emailEnabled} /></TD>
                      </TR>
                    )) : (
                      <TR><TD colSpan={6}><EmptyState title="No users found" description="New accounts will appear here after signup." /></TD></TR>
                    )}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent users</CardTitle>
                <CardDescription>Newest accounts entering the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentUsers.length ? data.recentUsers.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.name || "Unnamed user"}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                      </div>
                      <StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Created {formatDateTime(item.createdAt)}</div>
                  </div>
                )) : <EmptyState title="No recent users" description="New signups will appear here." />}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Care invite queue</CardTitle>
              <CardDescription>Recent care-team invitations and access handoff pressure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentInvites.length ? data.recentInvites.map((invite) => <RecentInviteCard key={invite.id} invite={invite} />) : <EmptyState title="No recent invites" description="Care-team invites will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit activity</CardTitle>
              <CardDescription>Latest care access, alert, and reminder audit entries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.auditFeed.length ? data.auditFeed.map((item) => <AuditCard key={item.id} item={item} />) : <EmptyState title="No audit activity yet" description="Audited access and workflow activity will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job pressure</CardTitle>
              <CardDescription>Recent queue runs that help admins spot operational issues.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentJobRuns.length ? data.recentJobRuns.map((run) => <JobRunCard key={run.id} run={run} />) : <EmptyState title="No job pressure right now" description="Recent failed or retrying job activity will appear here." />}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
