import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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
          healthProfile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!invite) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-[32px] border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-3xl font-semibold">Invite not found</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This invite link is invalid or has already been removed.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const ownerName =
    invite.owner.healthProfile?.fullName ??
    invite.owner.name ??
    "Patient";

  const userEmail = session?.user?.email?.toLowerCase() ?? "";
  const invitedEmail = invite.email.toLowerCase();
  const emailMatches = userEmail === invitedEmail;

  if (!session?.user) {
    const callbackUrl = `/invite/${token}`;

    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
        <div className="w-full rounded-[32px] border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
            VitaVault Invite
          </p>
          <h1 className="mt-3 text-3xl font-semibold">You have been invited</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {ownerName} invited <span className="font-medium">{invite.email}</span> as{" "}
            <span className="font-medium">{invite.accessRole}</span>.
          </p>

          <div className="mt-6 rounded-3xl border border-zinc-200 p-5 dark:border-zinc-800">
            <p className="text-sm">Invite expires: {invite.expiresAt.toLocaleString()}</p>
            {invite.note ? <p className="mt-2 text-sm">Note: {invite.note}</p> : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Sign in to accept
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invite.status !== "PENDING") {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
        <div className="w-full rounded-[32px] border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-3xl font-semibold">Invite already processed</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This invite is currently marked as <span className="font-medium">{invite.status}</span>.
          </p>
          <Link
            href="/care-team"
            className="mt-6 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Open Care Team
          </Link>
        </div>
      </div>
    );
  }

  if (invite.expiresAt <= new Date()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
        <div className="w-full rounded-[32px] border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-3xl font-semibold">Invite expired</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Ask the sender to create a new invite link.
          </p>
          <Link
            href="/care-team"
            className="mt-6 inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
          >
            Open Care Team
          </Link>
        </div>
      </div>
    );
  }

  if (!emailMatches) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
        <div className="w-full rounded-[32px] border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-3xl font-semibold">Wrong signed-in account</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This invite was sent to <span className="font-medium">{invite.email}</span>, but you are signed in as{" "}
            <span className="font-medium">{session.user.email}</span>.
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with the invited email address to accept this invite.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/care-team"
              className="inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
            >
              Open Care Team
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
      <div className="w-full rounded-[32px] border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          VitaVault Invite
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Accept care-team access</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {ownerName} invited <span className="font-medium">{invite.email}</span> to join as{" "}
          <span className="font-medium">{invite.accessRole}</span>.
        </p>

        <div className="mt-6 grid gap-4 rounded-3xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm">Owner: {invite.owner.email}</p>
          <p className="text-sm">Expires: {invite.expiresAt.toLocaleString()}</p>
          {invite.note ? <p className="text-sm">Note: {invite.note}</p> : null}
          <div className="grid gap-2 text-sm">
            <p>Permissions:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>View records: {invite.canViewRecords ? "Yes" : "No"}</li>
              <li>Edit records: {invite.canEditRecords ? "Yes" : "No"}</li>
              <li>Add notes: {invite.canAddNotes ? "Yes" : "No"}</li>
              <li>Export data: {invite.canExport ? "Yes" : "No"}</li>
              <li>Generate AI insights: {invite.canGenerateAIInsights ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={acceptCareInviteByTokenAction}>
            <input type="hidden" name="token" value={invite.token} />
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Accept invite
            </button>
          </form>

          <form action={declineCareInviteByTokenAction}>
            <input type="hidden" name="token" value={invite.token} />
            <button
              type="submit"
              className="rounded-2xl border px-4 py-2 text-sm font-medium"
            >
              Decline
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}