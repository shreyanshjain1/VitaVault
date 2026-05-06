import type { ReactNode } from "react";
import Link from "next/link";
import { DeviceConnectionStatus } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PASSWORD_POLICY_LABELS } from "@/lib/security/password-policy";
import { getMobileSessionRisk, getSecurityReadiness } from "@/lib/security/security-center";
import {
  changePasswordAction,
  revokeAllMobileSessionsAction,
  revokeMobileSessionAction,
} from "./actions";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function sessionTone(expiresAt: Date, revokedAt: Date | null) {
  if (revokedAt) return "neutral" as const;
  if (expiresAt.getTime() < Date.now()) return "warning" as const;
  return "success" as const;
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function SecurityMetric({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default async function SecurityPage() {
  const user = await requireUser();

  const [account, mobileTokens, connectionCount, careInviteCount, auditEvents] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id! },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
      },
    }),
    db.mobileSessionToken.findMany({
      where: { userId: user.id! },
      orderBy: [{ revokedAt: "asc" }, { lastUsedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    db.deviceConnection.count({
      where: {
        userId: user.id!,
        status: { in: [DeviceConnectionStatus.ACTIVE, DeviceConnectionStatus.ERROR] },
      },
    }),
    db.careInvite.count({
      where: { ownerUserId: user.id!, status: "PENDING" },
    }),
    db.accessAuditLog.findMany({
      where: {
        ownerUserId: user.id!,
        action: {
          in: [
            "PASSWORD_ROTATED",
            "MOBILE_SESSION_REVOKED",
            "ALL_MOBILE_SESSIONS_REVOKED",
            "USER_DEACTIVATED",
            "USER_REACTIVATED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  if (!account) {
    throw new Error("Unable to load account security profile.");
  }

  const activeMobileSessions = mobileTokens.filter(
    (item) => !item.revokedAt && item.expiresAt > new Date()
  );

  const revokedMobileSessions = mobileTokens.filter((item) => item.revokedAt);
  const readiness = getSecurityReadiness({
    hasPassword: Boolean(account.passwordHash),
    emailVerified: Boolean(account.emailVerified),
    activeMobileSessions: activeMobileSessions.length,
    revokedMobileSessions: revokedMobileSessions.length,
    connectionCount,
    pendingCareInvites: careInviteCount,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Security Center"
          description="Rotate credentials, review mobile/API sessions, confirm sensitive actions, and monitor account security posture."
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/audit-log" className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-medium hover:bg-muted/50">
                Audit log
              </Link>
              <Link href="/device-connection" className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-medium hover:bg-muted/50">
                Device connections
              </Link>
              <Link href="/care-team" className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95">
                Care access
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle>Security readiness</CardTitle>
              <CardDescription className="mt-1">
                A quick posture score based on password setup, email verification, sessions, devices, and pending care invites.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold">{readiness.score}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">{readiness.nextAction}</p>
                </div>
                <StatusPill tone={readiness.riskTone}>{readiness.score >= 80 ? "Healthy" : "Review needed"}</StatusPill>
              </div>
              <ProgressBar value={readiness.score} />
              <div className="grid gap-3 md:grid-cols-2">
                {readiness.checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                    <span className="text-sm font-medium">{check.label}</span>
                    <StatusPill tone={check.tone}>{check.passed ? "Pass" : "Review"}</StatusPill>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sensitive action policy</CardTitle>
              <CardDescription className="mt-1">
                High-impact security actions now require typed confirmation and audit logging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="font-medium text-foreground">Password rotation</p>
                <p className="mt-1">Enforces stronger password rules and writes an audit event.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="font-medium text-foreground">Session revocation</p>
                <p className="mt-1">Requires typing <span className="font-mono">REVOKE</span> or <span className="font-mono">REVOKE ALL</span>.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="font-medium text-foreground">Mobile login protection</p>
                <p className="mt-1">The mobile login API now has an in-memory rate-limit guard.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SecurityMetric title="Password" value={account.passwordHash ? "Configured" : "Missing"} description={`Credentials login ${account.passwordHash ? "is enabled" : "needs setup"}.`} icon={<LockKeyhole className="h-5 w-5 text-primary" />} />
          <SecurityMetric title="Email verification" value={account.emailVerified ? "Verified" : "Pending"} description={account.emailVerified ? `Verified on ${formatDate(account.emailVerified)}` : "Email verification is not complete."} icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />} />
          <SecurityMetric title="Mobile sessions" value={activeMobileSessions.length} description="Active API/mobile tokens." icon={<Smartphone className="h-5 w-5 text-sky-500" />} />
          <SecurityMetric title="Linked exposure" value={`${connectionCount} devices`} description={`${careInviteCount} pending care invite${careInviteCount === 1 ? "" : "s"}.`} icon={<TriangleAlert className="h-5 w-5 text-amber-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
          <Card>
            <CardHeader>
              <CardTitle>Rotate password</CardTitle>
              <CardDescription className="mt-1">
                Password updates now enforce stronger checks before credentials are changed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={changePasswordAction} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">Current password</label>
                  <Input id="currentPassword" name="currentPassword" type="password" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">New password</label>
                  <Input id="newPassword" name="newPassword" type="password" minLength={10} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" minLength={10} required />
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <p className="text-sm font-medium">Password policy</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    {PASSWORD_POLICY_LABELS.map((label) => (
                      <div key={label} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit">Update password</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile/API sessions</CardTitle>
              <CardDescription className="mt-1">
                Review session risk and revoke stale or unknown tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={revokeAllMobileSessionsAction} className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="font-medium">Revoke all active mobile/API sessions</p>
                    <p className="mt-1 text-sm">Type <span className="font-mono">REVOKE ALL</span> to confirm.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input name="confirmation" placeholder="REVOKE ALL" className="bg-background" />
                    <Button type="submit" variant="destructive" disabled={activeMobileSessions.length === 0}>Revoke all</Button>
                  </div>
                </div>
              </form>

              {mobileTokens.map((token) => {
                const state = getMobileSessionRisk(token);
                return (
                  <div key={token.id} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{token.name || "Unnamed mobile/API token"}</p>
                          <StatusPill tone={sessionTone(token.expiresAt, token.revokedAt)}>{token.revokedAt ? "Revoked" : token.expiresAt < new Date() ? "Expired" : "Active"}</StatusPill>
                          <StatusPill tone={state.tone}>{state.label}</StatusPill>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Created {formatDateTime(token.createdAt)} · Last used {formatDateTime(token.lastUsedAt)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Expires {formatDateTime(token.expiresAt)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{state.detail}</p>
                      </div>
                      {!token.revokedAt ? (
                        <form action={revokeMobileSessionAction} className="min-w-[220px] space-y-2">
                          <input type="hidden" name="tokenId" value={token.id} />
                          <Input name="confirmation" placeholder="Type REVOKE" />
                          <Button type="submit" variant="destructive" size="sm">Revoke</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {mobileTokens.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
                  No mobile/API tokens have been issued for this account.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>Identity snapshot</CardTitle>
              <CardDescription className="mt-1">Core account metadata attached to this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p><p className="mt-1 font-medium">{account.name || "No name set"}</p></div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p><p className="mt-1 font-medium">{account.email}</p></div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p><p className="mt-1 font-medium">{account.role}</p></div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Member since</p><p className="mt-1 font-medium">{formatDate(account.createdAt)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent security audit</CardTitle>
              <CardDescription className="mt-1">Recent account-security actions recorded in the audit log.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {event.action.includes("REVOKED") ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <History className="h-4 w-4 text-primary" />}
                      <p className="font-medium">{event.action.replaceAll("_", " ")}</p>
                    </div>
                    <Badge>{formatDateTime(event.createdAt)}</Badge>
                  </div>
                  {event.metadataJson ? <p className="mt-2 text-xs text-muted-foreground">{event.metadataJson}</p> : null}
                </div>
              ))}
              {auditEvents.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
                  Password changes and session revocations will appear here.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Security hardening summary</CardTitle>
            <CardDescription className="mt-1">Patch 39 adds guardrails around credentials, mobile API login, and sensitive session controls.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border/60 bg-background/40 p-5"><KeyRound className="h-5 w-5 text-primary" /><p className="mt-3 font-medium">Stronger password policy</p><p className="mt-1 text-sm text-muted-foreground">Credential rotation now rejects weak, common, or account-identifying passwords.</p></div>
            <div className="rounded-3xl border border-border/60 bg-background/40 p-5"><Smartphone className="h-5 w-5 text-sky-500" /><p className="mt-3 font-medium">Rate-limited mobile login</p><p className="mt-1 text-sm text-muted-foreground">Mobile credential attempts are protected by an in-memory rate-limit guard.</p></div>
            <div className="rounded-3xl border border-border/60 bg-background/40 p-5"><ShieldCheck className="h-5 w-5 text-emerald-500" /><p className="mt-3 font-medium">Audited sensitive actions</p><p className="mt-1 text-sm text-muted-foreground">Password rotation and mobile token revocation are written to access audit logs.</p></div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
