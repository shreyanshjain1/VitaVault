import Link from "next/link";
import { headers } from "next/headers";
import { Sparkles, UserRoundPlus, Users } from "lucide-react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSharedPatientCards } from "@/lib/access";
import { AppShell } from "@/components/app-shell";
import { CopyInviteField } from "@/components/copy-invite-field";
import {
  acceptCareInviteAction,
  declineCareInviteAction,
  inviteCareMemberAction,
  revokeCareAccessAction,
  updateCareAccessPermissionsAction,
} from "./actions";

export default async function CareTeamPage() {
  const user = await requireUser();
  const headerStore = await headers();

  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "";

  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "");

  const [outgoingInvites, currentTeam, incomingInvites, sharedPatients] =
    await Promise.all([
      db.careInvite.findMany({
        where: { ownerUserId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.careAccess.findMany({
        where: {
          ownerUserId: user.id,
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      user.email
        ? db.careInvite.findMany({
            where: {
              email: user.email.toLowerCase(),
              status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  healthProfile: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      getSharedPatientCards(user.id),
    ]);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Care Team
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Caregiver and doctor access
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Invite caregivers, doctors, or lab staff to collaborate securely. Every invite now includes a usable invite link, and shared members can open patient workspaces directly after acceptance.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/ai-insights"
                  className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Open AI Insights
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex rounded-2xl border px-4 py-2.5 text-sm font-medium"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active team</p>
                <p className="mt-2 text-3xl font-semibold">{currentTeam.length}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending incoming</p>
                <p className="mt-2 text-3xl font-semibold">{incomingInvites.length}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Shared with me</p>
                <p className="mt-2 text-3xl font-semibold">{sharedPatients.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-zinc-950 p-2 text-white dark:bg-white dark:text-black">
                <UserRoundPlus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Invite a caregiver or doctor</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  An invite record is created immediately and a shareable link appears in the Outgoing Invites section.
                </p>
              </div>
            </div>

            <form action={inviteCareMemberAction} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-2xl border px-3 py-2.5"
                  placeholder="doctor@example.com"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Access role</label>
                <select name="accessRole" defaultValue="CAREGIVER" className="rounded-2xl border px-3 py-2.5">
                  <option value="CAREGIVER">Caregiver</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="LAB_STAFF">Lab Staff</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Note</label>
                <textarea
                  name="note"
                  className="min-h-[110px] rounded-2xl border px-3 py-2.5"
                  placeholder="Optional onboarding note"
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-sm font-medium">Permissions</p>
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
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="canGenerateAIInsights" />
                  Can generate AI insights
                </label>
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Send invite
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-600 p-2 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Incoming invites</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  These appear when you are logged in with the same email that was invited.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {incomingInvites.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No pending invites.</p>
              ) : (
                incomingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {invite.owner.healthProfile?.fullName ?? invite.owner.name ?? "Patient"}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Owner email: {invite.owner.email}
                      </p>
                      <p className="text-sm">Role: {invite.accessRole}</p>
                      <p className="text-sm">Expires: {invite.expiresAt.toLocaleString()}</p>
                      {invite.note ? <p className="text-sm">Note: {invite.note}</p> : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <form action={acceptCareInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          Accept
                        </button>
                      </form>

                      <form action={declineCareInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="rounded-2xl border px-4 py-2 text-sm font-medium"
                        >
                          Decline
                        </button>
                      </form>

                      <Link
                        href={`/invite/${invite.token}`}
                        className="inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
                      >
                        Open invite page
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <h2 className="text-xl font-semibold">Patients shared with me</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Open patient workspaces where you already have active access.
            </p>

            <div className="mt-6 space-y-4">
              {sharedPatients.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No patients are currently shared with you.
                </p>
              ) : (
                sharedPatients.map((grant) => (
                  <div key={grant.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {grant.owner.healthProfile?.fullName ?? grant.owner.name ?? "Patient"}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {grant.owner.email}
                      </p>
                      <p className="text-sm">
                        Access role: {grant.accessRole} · View: {grant.canViewRecords ? "Yes" : "No"} · AI:{" "}
                        {grant.canGenerateAIInsights ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/patient/${grant.owner.id}`}
                        className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                      >
                        Open patient workspace
                      </Link>

                      {grant.canGenerateAIInsights ? (
                        <Link
                          href={`/patient/${grant.owner.id}`}
                          className="inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
                        >
                          Open AI-enabled view
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <h2 className="text-xl font-semibold">My active care team</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Review and adjust permissions without leaving this page.
            </p>

            <div className="mt-6 space-y-5">
              {currentTeam.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No active caregivers or doctors yet.
                </p>
              ) : (
                currentTeam.map((grant) => (
                  <div key={grant.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <div className="space-y-1">
                      <p className="font-medium">{grant.member.name ?? grant.member.email}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{grant.member.email}</p>
                      <p className="text-sm">
                        Role: {grant.accessRole} · Account type: {grant.member.role}
                      </p>
                    </div>

                    <form action={updateCareAccessPermissionsAction} className="mt-4 grid gap-2">
                      <input type="hidden" name="accessId" value={grant.id} />

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
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="canGenerateAIInsights"
                          defaultChecked={grant.canGenerateAIInsights}
                        />
                        Can generate AI insights
                      </label>

                      <textarea
                        name="note"
                        defaultValue={grant.note ?? ""}
                        className="min-h-[80px] rounded-2xl border px-3 py-2"
                        placeholder="Optional note"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                        >
                          Update permissions
                        </button>
                      </div>
                    </form>

                    <form action={revokeCareAccessAction} className="mt-3">
                      <input type="hidden" name="accessId" value={grant.id} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600"
                      >
                        Revoke access
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-600 p-2 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Outgoing invites</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Share the invite link with the exact email recipient. They can open the link, sign in, and accept.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {outgoingInvites.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No pending or historical invites yet.</p>
            ) : (
              outgoingInvites.map((invite) => {
                const inviteLink = `${origin}/invite/${invite.token}`;

                return (
                  <div key={invite.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <div className="space-y-1">
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Role: {invite.accessRole} · Status: {invite.status}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Expires: {invite.expiresAt.toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4">
                      <CopyInviteField value={inviteLink} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/invite/${invite.token}`}
                        className="inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
                      >
                        Open invite preview
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}