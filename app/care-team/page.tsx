import Link from "next/link";
import { headers } from "next/headers";
import { MessageSquare, Sparkles, UserRoundPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSharedPatientCards } from "@/lib/access";
import { AppShell } from "@/components/app-shell";
import { CopyInviteField } from "@/components/copy-invite-field";
import { PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import {
  acceptCareInviteAction,
  declineCareInviteAction,
  inviteCareMemberAction,
  resendCareInviteAction,
  revokeCareAccessAction,
  revokeCareInviteAction,
  updateCareAccessPermissionsAction,
} from "./actions";

function inviteTone(status: string, expiresAt: Date): "neutral" | "warning" | "success" | "danger" {
  const expired = status === "PENDING" && expiresAt <= new Date();
  if (expired) return "danger";
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "DECLINED") return "neutral";
  if (status === "REVOKED") return "neutral";
  if (status === "EXPIRED") return "danger";
  return "neutral";
}

function displayStatus(status: string, expiresAt: Date) {
  if (status === "PENDING" && expiresAt <= new Date()) return "EXPIRED";
  return status;
}

export default async function CareTeamPage() {
  const user = await requireUser();

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const proto =
    headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || (host ? `${proto}://${host}` : "");

  const emailDeliveryEnabled = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

  const [outgoingInvites, currentTeam, incomingInvites, sharedPatients] =
    await Promise.all([
      db.careInvite.findMany({
        where: { ownerUserId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.careAccess.findMany({
        where: { ownerUserId: user.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      user.email
        ? db.careInvite.findMany({
            where: { email: user.email.toLowerCase(), status: "PENDING" },
            orderBy: { createdAt: "desc" },
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
          })
        : Promise.resolve([]),
      getSharedPatientCards(user.id),
    ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Care Team"
          description="Invite caregivers, doctors, or lab staff to collaborate securely. Each invite can now be emailed directly and still includes a fallback shareable link."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/care-notes"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Care Notes
              </Link>
              <Link
                href="/ai-insights"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Open AI Insights
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

        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Invite a caregiver or doctor</CardTitle>
              <CardDescription className="mt-1">
                Step 1: create invite → Step 2: copy link → Step 3: recipient signs in using the invited email → Step 4: accept.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={inviteCareMemberAction} className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="caregiver@clinic.com" required />
                </div>

                <div className="space-y-2">
                  <Label>Access role</Label>
                  <Select name="accessRole" defaultValue="CAREGIVER">
                    <option value="CAREGIVER">Caregiver</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="LAB_STAFF">Lab Staff</option>
                  </Select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label>Note (optional)</Label>
                  <Textarea
                    name="note"
                    className="min-h-[90px]"
                    placeholder="Add context for the recipient (e.g., care goals, recent changes, what to focus on)."
                  />
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-5 lg:col-span-2">
                  <p className="text-sm font-semibold">Permissions</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep permissions minimal by default. You can update these later from “My active care team”.
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="canViewRecords" defaultChecked />
                      Can view records
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="canEditRecords" />
                      Can edit records
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="canAddNotes" />
                      Can add notes
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="canExport" />
                      Can export data
                    </label>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" name="canGenerateAIInsights" />
                      Can generate AI insights
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="mt-4 inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                  >
                    <UserRoundPlus className="mr-2 h-4 w-4" />
                    Send invite
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>At a glance</CardTitle>
              <CardDescription className="mt-1">Sharing status summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Active team</p>
                <p className="mt-1 text-2xl font-semibold">{currentTeam.length}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Incoming invites</p>
                <p className="mt-1 text-2xl font-semibold">{incomingInvites.length}</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Shared with me</p>
                <p className="mt-1 text-2xl font-semibold">{sharedPatients.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Incoming invites</CardTitle>
                  <CardDescription className="mt-1">
                    These appear when you are signed in with the invited email.
                  </CardDescription>
                </div>
                <StatusPill tone="info">Recipient view</StatusPill>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incomingInvites.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No pending invites.
                </div>
              ) : (
                incomingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-3xl border border-border/60 bg-background/40 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {invite.owner.healthProfile?.fullName ?? invite.owner.name ?? "Patient"}
                        </p>
                        <p className="text-sm text-muted-foreground">Owner email: {invite.owner.email}</p>
                      </div>
                      <StatusPill tone={inviteTone(invite.status, invite.expiresAt)}>
                        {displayStatus(invite.status, invite.expiresAt)}
                      </StatusPill>
                    </div>

                    <div className="mt-3 text-sm text-muted-foreground">
                      <p>Role: <span className="font-medium text-foreground/90">{invite.accessRole}</span></p>
                      <p>Expires: {invite.expiresAt.toLocaleString()}</p>
                      {invite.note ? <p className="mt-1">Note: {invite.note}</p> : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <form action={acceptCareInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
                        >
                          Accept
                        </button>
                      </form>
                      <form action={declineCareInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                        >
                          Decline
                        </button>
                      </form>
                      <Link
                        href={`/invite/${invite.token}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                      >
                        Open invite page
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patients shared with me</CardTitle>
              <CardDescription className="mt-1">
                Open patient workspaces where you already have active access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sharedPatients.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No patients are currently shared with you.
                </div>
              ) : (
                sharedPatients.map((grant) => (
                  <div key={grant.id} className="rounded-3xl border border-border/60 bg-background/40 p-5">
                    <p className="text-sm font-semibold">
                      {grant.owner.healthProfile?.fullName ?? grant.owner.name ?? "Patient"}
                    </p>
                    <p className="text-sm text-muted-foreground">{grant.owner.email}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="bg-background/70">{grant.accessRole}</Badge>
                      <Badge className="bg-background/70">View: {grant.canViewRecords ? "Yes" : "No"}</Badge>
                      <Badge className="bg-background/70">AI: {grant.canGenerateAIInsights ? "Yes" : "No"}</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/patient/${grant.owner.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                      >
                        Open patient workspace
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Outgoing invites</CardTitle>
                <CardDescription className="mt-1">
                  Share the invite link with the recipient. They accept after signing in using the invited email.
                </CardDescription>
              </div>
              <StatusPill tone="warning">Sender view</StatusPill>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {outgoingInvites.length === 0 ? (
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                No pending or historical invites yet.
              </div>
            ) : (
              outgoingInvites.map((invite) => {
                const inviteLink = `${origin}/invite/${invite.token}`;
                const shownStatus = displayStatus(invite.status, invite.expiresAt);

                return (
                  <div key={invite.id} className="rounded-3xl border border-border/60 bg-background/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{invite.email}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Role: <span className="font-medium text-foreground/90">{invite.accessRole}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {invite.expiresAt.toLocaleString()}
                        </p>
                      </div>
                      <StatusPill tone={inviteTone(invite.status, invite.expiresAt)}>
                        {shownStatus}
                      </StatusPill>
                    </div>

                    <div className="mt-4 space-y-2">
                      <CopyInviteField value={inviteLink} />
                      <p className="text-xs text-muted-foreground">
                        {emailDeliveryEnabled
                          ? "Invite emails are enabled. You can resend the email anytime while the invite is pending."
                          : "Manual link mode is active. Copy this invite URL and send it yourself."}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/invite/${invite.token}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                      >
                        Open invite preview
                      </Link>

                      {shownStatus === "PENDING" ? (
                        <>
                          <form action={resendCareInviteAction}>
                            <input type="hidden" name="inviteId" value={invite.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                            >
                              Resend email
                            </button>
                          </form>

                          <form action={revokeCareInviteAction}>
                            <input type="hidden" name="inviteId" value={invite.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100/70 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                            >
                              Revoke invite
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My active care team</CardTitle>
            <CardDescription className="mt-1">
              Review and adjust permissions without leaving this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentTeam.length === 0 ? (
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                No active caregivers or doctors yet.
              </div>
            ) : (
              currentTeam.map((grant) => (
                <div key={grant.id} className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{grant.member.name ?? grant.member.email}</p>
                      <p className="text-sm text-muted-foreground">{grant.member.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Role: {grant.accessRole} • Account type: {grant.member.role}
                      </p>
                    </div>
                    <StatusPill tone="success">ACTIVE</StatusPill>
                  </div>

                  <form action={updateCareAccessPermissionsAction} className="mt-4 grid gap-2">
                    <input type="hidden" name="accessId" value={grant.id} />

                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="canViewRecords" defaultChecked={grant.canViewRecords} />
                        Can view records
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="canEditRecords" defaultChecked={grant.canEditRecords} />
                        Can edit records
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="canAddNotes" defaultChecked={grant.canAddNotes} />
                        Can add notes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="canExport" defaultChecked={grant.canExport} />
                        Can export data
                      </label>
                      <label className="flex items-center gap-2 text-sm sm:col-span-2">
                        <input
                          type="checkbox"
                          name="canGenerateAIInsights"
                          defaultChecked={grant.canGenerateAIInsights}
                        />
                        Can generate AI insights
                      </label>
                    </div>

                    <div className="mt-2 space-y-2">
                      <Label>Internal note (optional)</Label>
                      <Textarea
                        name="note"
                        defaultValue={grant.note ?? ""}
                        className="min-h-[90px]"
                        placeholder="Optional note about this member’s responsibilities."
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                      >
                        Update permissions
                      </button>
                    </div>
                  </form>

                  <form action={revokeCareAccessAction} className="mt-3">
                    <input type="hidden" name="accessId" value={grant.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100/70 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                    >
                      Revoke access
                    </button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}