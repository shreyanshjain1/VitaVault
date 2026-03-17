import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@/components/ui";
import { StatusPill } from "@/components/common";
import {
  acceptCareInviteByTokenAction,
  declineCareInviteByTokenAction,
} from "@/app/care-team/actions";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invite = await db.careInvite.findUnique({
    where: { token },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          healthProfile: { select: { fullName: true } },
        },
      },
    },
  });

  const callbackUrl = `/invite/${token}`;

  if (!invite) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite not found</CardTitle>
            <CardDescription className="mt-1">
              This invite link is invalid or has already been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
            >
              Go to login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ownerName =
    invite.owner.healthProfile?.fullName ?? invite.owner.name ?? "Patient";
  const userEmail = session?.user?.email?.toLowerCase() ?? "";
  const invitedEmail = invite.email.toLowerCase();
  const emailMatches = userEmail === invitedEmail;

  const isExpired = invite.expiresAt <= new Date();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>VitaVault Invite</CardTitle>
                <CardDescription className="mt-1">
                  You’ve been invited into a shared care-team workspace.
                </CardDescription>
              </div>
              <StatusPill tone="warning">Action required</StatusPill>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
              <p className="text-sm text-muted-foreground">Invited by</p>
              <p className="mt-1 text-base font-semibold">{ownerName}</p>
              <p className="text-sm text-muted-foreground">{invite.owner.email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-background/70">{invite.accessRole}</Badge>
                <Badge className="bg-background/70">Invited email: {invite.email}</Badge>
                <Badge className="bg-background/70">Expires: {invite.expiresAt.toLocaleString()}</Badge>
              </div>

              {invite.note ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Note: {invite.note}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                Sign in to accept
              </Link>
              <Link
                href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Create account
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Safety: this grant controls access to records inside VitaVault. It does not grant access to external systems.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.status !== "PENDING") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite already processed</CardTitle>
            <CardDescription className="mt-1">
              This invite is currently marked as {invite.status}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/care-team"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
            >
              Open Care Team
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite expired</CardTitle>
            <CardDescription className="mt-1">
              Ask the sender to create a new invite link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/care-team"
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Open Care Team
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!emailMatches) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Wrong signed-in account</CardTitle>
            <CardDescription className="mt-1">
              This invite was sent to {invite.email}, but you are signed in as {session.user.email}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
              Sign in with the invited email address to accept this invite.
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                Go to login
              </Link>
              <Link
                href="/care-team"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Open Care Team
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Accept care-team access</CardTitle>
                <CardDescription className="mt-1">
                  Review the access grant and accept if it matches your role.
                </CardDescription>
              </div>
              <StatusPill tone="info">Pending</StatusPill>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="mt-1 text-base font-semibold">{ownerName}</p>
              <p className="text-sm text-muted-foreground">{invite.owner.email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-background/70">{invite.accessRole}</Badge>
                <Badge className="bg-background/70">Expires: {invite.expiresAt.toLocaleString()}</Badge>
              </div>

              {invite.note ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Note: {invite.note}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
              <p className="text-sm font-semibold">Permissions</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>View records: {invite.canViewRecords ? "Yes" : "No"}</li>
                <li>Edit records: {invite.canEditRecords ? "Yes" : "No"}</li>
                <li>Add notes: {invite.canAddNotes ? "Yes" : "No"}</li>
                <li>Export data: {invite.canExport ? "Yes" : "No"}</li>
                <li>Generate AI insights: {invite.canGenerateAIInsights ? "Yes" : "No"}</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <form action={acceptCareInviteByTokenAction}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
                >
                  Accept invite
                </button>
              </form>
              <form action={declineCareInviteByTokenAction}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  Decline
                </button>
              </form>

              <Link
                href="/care-team"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Open Care Team
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              This access is informational and permission-based. It does not diagnose or replace clinical judgment.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}