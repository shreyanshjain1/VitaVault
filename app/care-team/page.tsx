import Link from "next/link";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSharedPatientCards } from "@/lib/access";
import { AppShell } from "@/components/app-shell";
import {
  acceptCareInviteAction,
  declineCareInviteAction,
  inviteCareMemberAction,
  revokeCareAccessAction,
  updateCareAccessPermissionsAction,
} from "./actions";

export default async function CareTeamPage() {
  const user = await requireUser();

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
        <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h1 className="text-3xl font-semibold">Care Team Access</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Invite caregivers and doctors, control permissions, and manage the patients shared with you.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Invite a caregiver or doctor</h2>
            <form action={inviteCareMemberAction} className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-xl border px-3 py-2"
                  placeholder="doctor@example.com"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Access role</label>
                <select name="accessRole" defaultValue="CAREGIVER" className="rounded-xl border px-3 py-2">
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
                  className="min-h-[100px] rounded-xl border px-3 py-2"
                  placeholder="Optional note for the invited person"
                />
              </div>

              <div className="grid gap-2">
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
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Send invite
              </button>
            </form>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Incoming invites</h2>
            <div className="mt-5 space-y-4">
              {incomingInvites.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No pending invites.</p>
              ) : (
                incomingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-xl border p-4">
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
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          Accept
                        </button>
                      </form>

                      <form action={declineCareInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="rounded-xl border px-4 py-2 text-sm font-medium"
                        >
                          Decline
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Patients shared with me</h2>
            <div className="mt-5 space-y-4">
              {sharedPatients.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No patients are currently shared with you.
                </p>
              ) : (
                sharedPatients.map((grant) => (
                  <div key={grant.id} className="rounded-xl border p-4">
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

                    <div className="mt-4">
                      <Link
                        href={`/patient/${grant.owner.id}`}
                        className="inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                      >
                        Open patient workspace
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">My active care team</h2>
            <div className="mt-5 space-y-5">
              {currentTeam.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No active caregivers or doctors yet.
                </p>
              ) : (
                currentTeam.map((grant) => (
                  <div key={grant.id} className="rounded-xl border p-4">
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
                        className="min-h-[80px] rounded-xl border px-3 py-2"
                        placeholder="Optional note"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                        >
                          Update permissions
                        </button>
                      </div>
                    </form>

                    <form action={revokeCareAccessAction} className="mt-3">
                      <input type="hidden" name="accessId" value={grant.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600"
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

        <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">Outgoing invites</h2>
          <div className="mt-5 space-y-4">
            {outgoingInvites.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No pending or historical invites yet.</p>
            ) : (
              outgoingInvites.map((invite) => (
                <div key={invite.id} className="rounded-xl border p-4">
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Role: {invite.accessRole} · Status: {invite.status}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Expires: {invite.expiresAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}