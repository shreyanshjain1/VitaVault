import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppRole } from "@prisma/client";
import { AlertTriangle, Ban, CheckCircle2, Cpu, MailCheck, RotateCcw, Shield, UserPlus, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TBody, TD, Textarea, TH, THead, TR } from "@/components/ui";
import { isEmailDeliveryConfigured } from "@/lib/account-email";
import { getAdminWorkspaceData } from "@/lib/admin-dashboard";
import { APP_ROLES } from "@/lib/domain/enums";
import { requireUser } from "@/lib/session";
import { deactivateUserAction, reactivateUserAction, resendVerificationForUserAction, revokeUserMobileSessionsAction } from "./actions";

type AdminWorkspaceData = Awaited<ReturnType<typeof getAdminWorkspaceData>>;
type UserRosterItem = AdminWorkspaceData["userRoster"][number];
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
  if (["FAILED", "REVOKED", "DECLINED", "EXPIRED", "DEACTIVATED"].includes(status)) return "danger" as const;
  if (["PENDING", "RETRYING", "ERROR"].includes(status)) return "warning" as const;
  if (["OPEN", "ACTIVE"].includes(status)) return "info" as const;
  if (["COMPLETED", "RESOLVED", "VERIFIED", "SENT", "REACTIVATED"].includes(status)) return "success" as const;
  return "neutral" as const;
}

function sourceTone(source: "ACCESS" | "ALERT" | "REMINDER") {
  if (source === "ALERT") return "danger" as const;
  if (source === "REMINDER") return "warning" as const;
  return "info" as const;
}

function StatCard({ title, value, description, icon }: { title: string; value: number | string; description: string; icon: ReactNode }) {
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
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function UserActions({ item, emailEnabled, currentUserId }: { item: UserRosterItem; emailEnabled: boolean; currentUserId: string }) {
  const isDeactivated = Boolean(item.deactivatedAt);
  const isSelf = item.id === currentUserId;

  return (
    <div className="min-w-[230px] space-y-2">
      {isDeactivated ? (
        <form action={reactivateUserAction}>
          <input type="hidden" name="userId" value={item.id} />
          <Button type="submit" size="sm" className="w-full">
            <RotateCcw className="h-4 w-4" />
            Reactivate account
          </Button>
        </form>
      ) : (
        <form action={deactivateUserAction} className="space-y-2">
          <input type="hidden" name="userId" value={item.id} />
          <Textarea
            name="reason"
            rows={2}
            placeholder={isSelf ? "You cannot deactivate yourself" : "Reason for deactivation"}
            disabled={isSelf}
          />
          <Button type="submit" size="sm" variant="destructive" className="w-full" disabled={isSelf}>
            <Ban className="h-4 w-4" />
            Deactivate account
          </Button>
        </form>
      )}

      <form action={revokeUserMobileSessionsAction}>
        <input type="hidden" name="userId" value={item.id} />
        <Button type="submit" size="sm" variant="outline" className="w-full">Revoke sessions</Button>
      </form>

      {!item.emailVerified && !isDeactivated ? (
        <form action={resendVerificationForUserAction}>
          <input type="hidden" name="userId" value={item.id} />
          <Button type="submit" size="sm" variant="secondary" className="w-full" disabled={!emailEnabled}>Resend verification</Button>
        </form>
      ) : null}
    </div>
  );
}

function AuditCard({ item }: { item: AuditFeedItem }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={sourceTone(item.source)}>{item.source}</StatusPill>
            <span className="font-medium">{item.action}</span>
          </div>
          <p className="text-sm text-muted-foreground">{item.targetLabel}</p>
        </div>
        <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
        <p>Owner: {item.ownerLabel}</p>
        <p>Actor: {item.actorLabel}</p>
      </div>
      {item.note ? <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{item.note}</p> : null}
    </div>
  );
}

function JobCard({ item }: { item: RecentJobRunItem }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.jobName || item.jobKind}</p>
          <p className="text-xs text-muted-foreground">{item.queueName} • {formatDateTime(item.createdAt)}</p>
        </div>
        <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
      </div>
      {item.errorMessage ? <p className="mt-3 text-sm text-destructive">{item.errorMessage}</p> : null}
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
          description="Review user growth, account verification, account lifecycle state, care-team activity, audit signals, and operational risks from one business-facing admin workspace."
          action={(
            <div className="flex flex-wrap gap-2">
              <Link href="/ops" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Operations</Link>
              <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Job runs</Link>
              <Link href="/security" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Security</Link>
            </div>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total users" value={data.summary.totalUsers} description="All accounts currently provisioned inside VitaVault." icon={<Users className="h-5 w-5 text-primary" />} />
          <StatCard title="Verified users" value={data.summary.verifiedUsers} description={`${data.summary.verificationRate}% of users have completed email verification.`} icon={<MailCheck className="h-5 w-5 text-emerald-500" />} />
          <StatCard title="Pending invites" value={data.summary.pendingInvites} description="Outstanding care-team invitations awaiting action." icon={<UserPlus className="h-5 w-5 text-violet-500" />} />
          <StatCard title="Deactivated users" value={data.summary.deactivatedUsers} description="Recently visible accounts blocked from sign-in and mobile/API use." icon={<Ban className="h-5 w-5 text-rose-500" />} />
          <StatCard title="Risk items" value={data.summary.riskItems} description="Open alerts, failed jobs, pending invites, and deactivated accounts needing review." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Active care access" value={data.summary.activeCareAccess} description="Currently active care relationships across the system." icon={<Shield className="h-5 w-5 text-sky-500" />} />
          <StatCard title="Open alerts" value={data.summary.openAlerts} description="Alert events still waiting for review or resolution." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Failed jobs" value={data.summary.failedJobs} description="Queue runs stuck in failed or retrying status." icon={<Cpu className="h-5 w-5 text-orange-500" />} />
          <StatCard title="Active sessions" value={data.summary.activeMobileSessions} description="Non-revoked API or mobile sessions still valid now." icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>User roster snapshot</CardTitle>
              <CardDescription>Recent accounts with role, verification, lifecycle status, footprint, and admin controls.</CardDescription>
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
                    {data.userRoster.map((item: UserRosterItem) => {
                      const isDeactivated = Boolean(item.deactivatedAt);
                      return (
                        <TR key={item.id}>
                          <TD>
                            <div className="space-y-1">
                              <div className="font-medium">{item.name || "Unnamed user"}</div>
                              <div className="text-xs text-muted-foreground">{item.email}</div>
                              {item.deactivatedReason ? <div className="text-xs text-destructive">{item.deactivatedReason}</div> : null}
                            </div>
                          </TD>
                          <TD><StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill></TD>
                          <TD>
                            <div className="flex flex-col gap-2">
                              <StatusPill tone={item.emailVerified ? "success" : "warning"}>{item.emailVerified ? "Verified" : "Pending email"}</StatusPill>
                              <StatusPill tone={isDeactivated ? "danger" : "success"}>{isDeactivated ? "Deactivated" : "Active"}</StatusPill>
                            </div>
                          </TD>
                          <TD>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <Badge>{item._count.reminders} reminders</Badge>
                              <Badge>{item._count.alertEvents} alerts</Badge>
                              <Badge>{item._count.documents} docs</Badge>
                              <Badge>{item._count.mobileSessionTokens} sessions</Badge>
                            </div>
                          </TD>
                          <TD>{formatDateTime(item.createdAt)}</TD>
                          <TD><UserActions item={item} emailEnabled={emailEnabled} currentUserId={user.id} /></TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
              {data.userRoster.length === 0 ? <EmptyState title="No users yet" description="New users will appear here once accounts are created." /> : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification readiness</CardTitle>
                <CardDescription>Email verification signal across provisioned users.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold">{data.summary.verificationRate}%</p>
                    <p className="text-sm text-muted-foreground">{data.summary.verifiedUsers} of {data.summary.totalUsers} users verified</p>
                  </div>
                  <StatusPill tone={data.summary.verificationRate >= 80 ? "success" : data.summary.verificationRate >= 50 ? "warning" : "danger"}>
                    {data.summary.verificationRate >= 80 ? "Healthy" : "Needs follow-up"}
                  </StatusPill>
                </div>
                <ProgressBar value={data.summary.verificationRate} />
                {!emailEnabled ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Email delivery is not configured, so verification resend actions are disabled.</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lifecycle controls</CardTitle>
                <CardDescription>Admin account suspension now uses the schema-backed deactivation fields.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">Deactivated users are blocked by the existing auth/session guards and cannot continue protected app workflows.</p>
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">Deactivation revokes mobile/API sessions and writes an admin audit log entry for traceability.</p>
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">Admins cannot deactivate their own account from this panel.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent users</CardTitle>
                <CardDescription>Newest accounts created in the workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                    <div>
                      <p className="font-medium">{item.name || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground">{item.email} • {formatDateTime(item.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill>
                      <StatusPill tone={item.deactivatedAt ? "danger" : "success"}>{item.deactivatedAt ? "Deactivated" : "Active"}</StatusPill>
                    </div>
                  </div>
                ))}
                {data.recentUsers.length === 0 ? <EmptyState title="No recent users" description="Account creation events will appear here." /> : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Invite queue</CardTitle>
              <CardDescription>Latest care-team invites needing review or context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentInvites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">Owner: {invite.owner.name || invite.owner.email}</p>
                    </div>
                    <StatusPill tone={statusTone(invite.status)}>{invite.status}</StatusPill>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Role: {invite.accessRole} • Expires: {formatDateTime(invite.expiresAt)}</p>
                </div>
              ))}
              {data.recentInvites.length === 0 ? <EmptyState title="No invites" description="Care-team invites will appear here." /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job activity</CardTitle>
              <CardDescription>Recent background processing runs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentJobRuns.map((job) => <JobCard key={job.id} item={job} />)}
              {data.recentJobRuns.length === 0 ? <EmptyState title="No job runs" description="Worker activity will appear here once jobs run." /> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Merged audit feed</CardTitle>
            <CardDescription>Care access, alert, reminder, and admin lifecycle audit entries merged into a single admin timeline.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {data.auditFeed.map((item) => <AuditCard key={item.id} item={item} />)}
            {data.auditFeed.length === 0 ? <EmptyState title="No audit events" description="Audit activity will appear here once workflows are used." /> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
