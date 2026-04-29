import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppRole } from "@prisma/client";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardList,
  Cpu,
  MailCheck,
  Radar,
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
  Textarea,
} from "@/components/ui";
import { APP_ROLES } from "@/lib/domain/enums";
import { requireUser } from "@/lib/session";
import { getAdminWorkspaceData } from "@/lib/admin-dashboard";
import { isEmailDeliveryConfigured } from "@/lib/account-email";
import {
  deactivateUserAction,
  reactivateUserAction,
  resendVerificationForUserAction,
  revokeUserMobileSessionsAction,
} from "./actions";

type AdminWorkspaceData = Awaited<ReturnType<typeof getAdminWorkspaceData>>;
type UserRosterItem = AdminWorkspaceData["userRoster"][number];
type RecentUserItem = AdminWorkspaceData["recentUsers"][number];
type RecentInviteItem = AdminWorkspaceData["recentInvites"][number];
type AuditFeedItem = AdminWorkspaceData["auditFeed"][number];
type RecentJobRunItem = AdminWorkspaceData["recentJobRuns"][number];
type Tone = "neutral" | "info" | "success" | "warning" | "danger";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function roleTone(role: AppRole): Tone {
  if (role === AppRole.ADMIN) return "danger";
  if (role === AppRole.DOCTOR || role === AppRole.LAB_STAFF) return "info";
  if (role === AppRole.CAREGIVER) return "warning";
  return "neutral";
}

function statusTone(status: string): Tone {
  if (["FAILED", "REVOKED", "DECLINED", "EXPIRED", "DEACTIVATED", "CRITICAL"].includes(status)) return "danger";
  if (["PENDING", "RETRYING", "ERROR", "OVERDUE", "MISSED"].includes(status)) return "warning";
  if (["OPEN", "ACTIVE", "QUEUED"].includes(status)) return "info";
  if (["COMPLETED", "RESOLVED", "VERIFIED", "SENT"].includes(status)) return "success";
  return "neutral";
}

function sourceTone(source: "ACCESS" | "ALERT" | "REMINDER"): Tone {
  if (source === "ALERT") return "danger";
  if (source === "REMINDER") return "warning";
  return "info";
}

function StatCard({ title, value, description, icon, tone = "neutral" }: { title: string; value: number | string; description: string; icon: ReactNode; tone?: Tone }) {
  const ringClass =
    tone === "danger"
      ? "border-rose-200/80 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20"
      : tone === "warning"
        ? "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
        : tone === "success"
          ? "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : tone === "info"
            ? "border-sky-200/80 bg-sky-50/70 dark:border-sky-900/40 dark:bg-sky-950/20"
            : "border-border/60 bg-card/85";

  return (
    <Card className={ringClass}>
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

function AdminUserActions({ item, emailEnabled }: { item: UserRosterItem; emailEnabled: boolean }) {
  const isDisabled = Boolean(item.deactivatedAt);

  return (
    <div className="space-y-2">
      {isDisabled ? (
        <form action={reactivateUserAction}>
          <input type="hidden" name="userId" value={item.id} />
          <Button type="submit" size="sm">Reactivate</Button>
        </form>
      ) : (
        <form action={deactivateUserAction} className="space-y-2">
          <input type="hidden" name="userId" value={item.id} />
          <Textarea name="reason" rows={2} placeholder="Reason for deactivation" className="min-w-[220px]" />
          <Button type="submit" size="sm" variant="destructive">Deactivate</Button>
        </form>
      )}

      <form action={revokeUserMobileSessionsAction}>
        <input type="hidden" name="userId" value={item.id} />
        <Button type="submit" size="sm" variant="outline">Revoke sessions</Button>
      </form>

      {!item.emailVerified && !isDisabled ? (
        <form action={resendVerificationForUserAction}>
          <input type="hidden" name="userId" value={item.id} />
          <Button type="submit" size="sm" variant="secondary" disabled={!emailEnabled}>Resend verification</Button>
        </form>
      ) : null}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function RecentUserCard({ item }: { item: RecentUserItem }) {
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{item.name || "Unnamed user"}</div>
          <div className="text-xs text-muted-foreground">{item.email}</div>
        </div>
        <StatusPill tone={roleTone(item.role)}>{item.role}</StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone={item.emailVerified ? "success" : "warning"}>{item.emailVerified ? "Verified" : "Pending"}</StatusPill>
        <StatusPill tone={item.deactivatedAt ? "danger" : "success"}>{item.deactivatedAt ? "Deactivated" : "Active"}</StatusPill>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Joined {formatDateTime(item.createdAt)}</div>
    </div>
  );
}

function InviteCard({ item }: { item: RecentInviteItem }) {
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
        <Badge>{item.accessRole}</Badge>
      </div>
      <div className="mt-3 font-medium">{item.email}</div>
      <div className="text-sm text-muted-foreground">Owner: {item.owner.name || item.owner.email || item.owner.id}</div>
      <div className="mt-2 text-xs text-muted-foreground">Sent {formatDateTime(item.createdAt)} • expires {formatDateTime(item.expiresAt)}</div>
    </div>
  );
}

function JobRunCard({ item }: { item: RecentJobRunItem }) {
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
        <Badge>{item.queueName}</Badge>
      </div>
      <div className="mt-3 font-medium">{item.jobName}</div>
      <div className="text-sm text-muted-foreground">{String(item.jobKind).replaceAll("_", " ")}</div>
      {item.errorMessage ? <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">{item.errorMessage}</div> : null}
      <div className="mt-2 text-xs text-muted-foreground">Attempts {item.attemptsMade}/{item.maxAttempts} • {formatDateTime(item.createdAt)}</div>
    </div>
  );
}

function AuditCard({ item }: { item: AuditFeedItem }) {
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={sourceTone(item.source)}>{item.source}</StatusPill>
        <Badge>{item.action}</Badge>
      </div>
      <div className="mt-3 text-sm font-medium">{item.targetLabel}</div>
      <div className="text-sm text-muted-foreground">Owner: {item.ownerLabel}</div>
      <div className="text-sm text-muted-foreground">Actor: {item.actorLabel}</div>
      {item.note ? <div className="mt-2 text-xs text-muted-foreground">{item.note}</div> : null}
      <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
    </div>
  );
}

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== APP_ROLES.ADMIN) redirect("/dashboard");

  const data = await getAdminWorkspaceData();
  const emailEnabled = isEmailDeliveryConfigured();
  const riskCount = data.operationalRisks.filter((item) => item.tone === "danger" || item.tone === "warning").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Admin Command Center"
          description="Control users, care access, invite pressure, risk signals, and operational activity from one business-facing admin workspace."
          action={(
            <div className="flex flex-wrap gap-2">
              <Link href="/ops" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Operations</Link>
              <Link href="/audit-log" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Audit log</Link>
              <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Job runs</Link>
              <Link href="/security" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Security</Link>
            </div>
          )}
        />

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <Badge>Business admin overview</Badge>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">VitaVault has {data.summary.totalUsers} total users and {data.summary.activeCareAccess} active care relationships.</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  This command center turns admin data into reviewer-friendly business signals: growth, verification, access pressure, clinical risk, worker reliability, and mobile/API session visibility.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Verification rate</div>
                  <div className="mt-1 text-2xl font-semibold">{data.summary.verificationRate}%</div>
                  <ProgressBar value={data.summary.verificationRate} />
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">New users, 7 days</div>
                  <div className="mt-1 text-2xl font-semibold">{data.summary.newUsers7d}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Recent account growth signal</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Risk items</div>
                  <div className="mt-1 text-2xl font-semibold">{riskCount}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Warnings or critical admin signals</div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2 font-medium"><Radar className="h-4 w-4 text-primary" /> Admin runbook</div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div>1. Review high-priority alerts and overdue reminders.</div>
                <div>2. Check failed jobs and device sync failures.</div>
                <div>3. Resolve pending verification and invite bottlenecks.</div>
                <div>4. Use audit logs for access and security traceability.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total users" value={data.summary.totalUsers} description="All accounts provisioned inside VitaVault." icon={<Users className="h-5 w-5 text-primary" />} tone="info" />
          <StatCard title="Verified users" value={data.summary.verifiedUsers} description="Accounts that completed email verification." icon={<MailCheck className="h-5 w-5 text-emerald-500" />} tone="success" />
          <StatCard title="Pending invites" value={data.summary.pendingInvites} description="Outstanding care-team invitations." icon={<UserPlus className="h-5 w-5 text-violet-500" />} tone={data.summary.pendingInvites ? "warning" : "success"} />
          <StatCard title="Admin accounts" value={data.summary.adminUsers} description="Users with full administrative controls." icon={<UserCog className="h-5 w-5 text-rose-500" />} />
          <StatCard title="Deactivated users" value={data.summary.deactivatedUsers} description="Accounts currently suspended." icon={<Ban className="h-5 w-5 text-destructive" />} tone={data.summary.deactivatedUsers ? "warning" : "success"} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Active care access" value={data.summary.activeCareAccess} description="Active care-sharing relationships." icon={<Shield className="h-5 w-5 text-sky-500" />} tone="info" />
          <StatCard title="Open alerts" value={data.summary.openAlerts} description="Alert events waiting for review." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} tone={data.summary.openAlerts ? "warning" : "success"} />
          <StatCard title="Failed jobs" value={data.summary.failedJobs} description="Queue runs in failed or retrying state." icon={<Cpu className="h-5 w-5 text-orange-500" />} tone={data.summary.failedJobs ? "danger" : "success"} />
          <StatCard title="Active sessions" value={data.summary.activeMobileSessions} description="Valid non-revoked API/mobile sessions." icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} tone="success" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Operational risk board</CardTitle>
              <CardDescription>Prioritized system, clinical, and account signals for admin review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {data.operationalRisks.map((item) => (
                <div key={item.key} className="rounded-2xl border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{item.label}</div>
                    <StatusPill tone={item.tone}>{item.value}</StatusPill>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role mix</CardTitle>
              <CardDescription>User distribution across patient, caregiver, provider, lab, and admin roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.roleBreakdown.map((item) => (
                <div key={item.role} className="rounded-2xl border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{item.role}</div>
                    <StatusPill tone={item.tone}>{item.value}</StatusPill>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${data.summary.totalUsers ? Math.round((item.value / data.summary.totalUsers) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User roster and moderation controls</CardTitle>
            <CardDescription>Recent accounts with role, verification, footprint, and direct lifecycle actions.</CardDescription>
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
                  {data.userRoster.map((item: UserRosterItem) => (
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
                          <StatusPill tone={item.emailVerified ? "success" : "warning"}>{item.emailVerified ? "Verified" : "Pending"}</StatusPill>
                          <StatusPill tone={item.deactivatedAt ? "danger" : "success"}>{item.deactivatedAt ? "Deactivated" : "Active"}</StatusPill>
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
                      <TD><AdminUserActions item={item} emailEnabled={emailEnabled} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent users</CardTitle>
              <CardDescription>Newest accounts and verification state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentUsers.length ? data.recentUsers.map((item) => <RecentUserCard key={item.id} item={item} />) : <EmptyState title="No users yet" description="New signups will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite queue</CardTitle>
              <CardDescription>Care-team invites that may need follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentInvites.length ? data.recentInvites.map((item) => <InviteCard key={item.id} item={item} />) : <EmptyState title="No invites yet" description="Care-team invitations will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent jobs</CardTitle>
              <CardDescription>Latest worker runs with error context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentJobRuns.length ? data.recentJobRuns.map((item) => <JobRunCard key={item.id} item={item} />) : <EmptyState title="No job runs yet" description="Worker runs will appear after background processing starts." />}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Recent audit feed</CardTitle>
                <CardDescription>Access, alert, and reminder actions across the system.</CardDescription>
              </div>
              <Link href="/audit-log" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                Open full audit log
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.auditFeed.length ? data.auditFeed.map((item) => <AuditCard key={item.id} item={item} />) : <EmptyState title="No audit activity yet" description="Audited access and workflow activity will appear here." />}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 font-medium"><ClipboardList className="h-4 w-4 text-primary" /> Patch 11 admin polish</div>
              <p className="mt-1 text-sm text-muted-foreground">This screen now presents VitaVault as a stronger admin product surface with growth, verification, risk, moderation, and operations traceability.</p>
            </div>
            <Link href="/ops" className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              Review operations
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
