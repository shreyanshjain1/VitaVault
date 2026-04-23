import Link from "next/link";
import { DeviceConnectionStatus } from "@prisma/client";
import { LockKeyhole, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  changePasswordAction,
  revokeAllMobileSessionsAction,
  revokeMobileSessionAction,
} from "./actions";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function sessionTone(expiresAt: Date, revokedAt: Date | null) {
  if (revokedAt) return "neutral" as const;
  if (expiresAt.getTime() < Date.now()) return "warning" as const;
  return "success" as const;
}

export default async function SecurityPage() {
  const user = await requireUser();

  const [account, mobileTokens, connectionCount, careInviteCount] = await Promise.all([
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
  ]);

  if (!account) {
    throw new Error("Unable to load account security profile.");
  }

  const activeMobileSessions = mobileTokens.filter(
    (item) => !item.revokedAt && item.expiresAt > new Date()
  );

  const revokedMobileSessions = mobileTokens.filter((item) => item.revokedAt);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Security Center"
          description="Rotate your password, review mobile API sessions, and monitor the security posture of your personal health workspace."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/device-connection"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-medium hover:bg-muted/50"
              >
                Device connections
              </Link>
              <Link
                href="/care-team"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                Care access
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Account protection</CardTitle>
              <CardDescription className="mt-1">
                High-level account readiness and identity posture.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Password</p>
                  <LockKeyhole className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold">
                  {account.passwordHash ? "Configured" : "Not configured"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Credentials login {account.passwordHash ? "is enabled" : "needs setup"}.
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Email verification</p>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-4 text-lg font-semibold">
                  {account.emailVerified ? "Verified" : "Pending"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {account.emailVerified
                    ? `Verified on ${formatDateTime(account.emailVerified)}`
                    : "Email verification flow is not yet completed for this account."}
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Mobile sessions</p>
                  <Smartphone className="h-5 w-5 text-sky-500" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{activeMobileSessions.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Active API/mobile tokens.</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Linked exposure</p>
                  <TriangleAlert className="h-5 w-5 text-amber-500" />
                </div>
                <p className="mt-4 text-lg font-semibold">{connectionCount} device links · {careInviteCount} pending invites</p>
                <p className="mt-1 text-sm text-muted-foreground">Review external/mobile access surfaces regularly.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity snapshot</CardTitle>
              <CardDescription className="mt-1">
                Core account metadata currently attached to this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="mt-1 font-medium">{account.name || "No name set"}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{account.email}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p className="mt-1 font-medium">{account.role}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Member since</p>
                <p className="mt-1 font-medium">{new Date(account.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
          <Card>
            <CardHeader>
              <CardTitle>Rotate password</CardTitle>
              <CardDescription className="mt-1">
                Update your credentials without affecting the rest of the app state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={changePasswordAction} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">
                    Current password
                  </label>
                  <Input id="currentPassword" name="currentPassword" type="password" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New password
                  </label>
                  <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm new password
                  </label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  Password changes affect future sign-ins. Existing browser sessions are JWT-based, so this page is focused on credential rotation and mobile token control.
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                >
                  Update password
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Mobile session visibility</CardTitle>
                  <CardDescription className="mt-1">
                    Revoke personal API/mobile tokens that should no longer have access.
                  </CardDescription>
                </div>
                <form action={revokeAllMobileSessionsAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                  >
                    Revoke all mobile sessions
                  </button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mobileTokens.length ? (
                mobileTokens.map((token) => {
                  const revoked = Boolean(token.revokedAt);
                  const expired = token.expiresAt.getTime() < Date.now();

                  return (
                    <div
                      key={token.id}
                      className="rounded-3xl border border-border/60 bg-background/40 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {token.name?.trim() || "Unnamed mobile session"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Created {formatDateTime(token.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={sessionTone(token.expiresAt, token.revokedAt)}>
                            {revoked ? "Revoked" : expired ? "Expired" : "Active"}
                          </StatusPill>
                          <StatusPill tone="neutral">Expires {new Date(token.expiresAt).toLocaleDateString()}</StatusPill>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                        <p>Last used: {formatDateTime(token.lastUsedAt)}</p>
                        <p>Revoked at: {formatDateTime(token.revokedAt)}</p>
                        <p>ID: {token.id.slice(0, 12)}…</p>
                      </div>

                      {!revoked && !expired ? (
                        <form action={revokeMobileSessionAction} className="mt-4">
                          <input type="hidden" name="tokenId" value={token.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                          >
                            Revoke session
                          </button>
                        </form>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  No mobile sessions recorded yet. Mobile/API tokens created through the mobile auth flow will appear here.
                </div>
              )}

              {revokedMobileSessions.length ? (
                <p className="text-xs text-muted-foreground">
                  {revokedMobileSessions.length} revoked session{revokedMobileSessions.length === 1 ? "" : "s"} retained for audit visibility.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
