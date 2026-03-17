import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireOwnerAccess } from "@/lib/access";
import { generatePatientInsightAction } from "../actions";

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bpLabel(systolic: number | null, diastolic: number | null) {
  if (!systolic && !diastolic) return "—";
  return `${systolic ?? "—"}/${diastolic ?? "—"}`;
}

export default async function SharedPatientWorkspacePage({
  params,
}: {
  params: Promise<{ ownerUserId: string }>;
}) {
  const { ownerUserId } = await params;
  const actor = await requireUser();
  const access = await requireOwnerAccess(actor.id, ownerUserId, "view");

  const [owner, medications, appointments, labs, vitals, documents, latestInsight, careTeam] =
    await Promise.all([
      db.user.findUnique({
        where: { id: ownerUserId },
        select: {
          id: true,
          name: true,
          email: true,
          healthProfile: true,
        },
      }),
      db.medication.findMany({
        where: { userId: ownerUserId },
        orderBy: { createdAt: "desc" },
        include: {
          schedules: true,
          doctor: true,
        },
        take: 10,
      }),
      db.appointment.findMany({
        where: { userId: ownerUserId },
        orderBy: { scheduledAt: "desc" },
        take: 10,
      }),
      db.labResult.findMany({
        where: { userId: ownerUserId },
        orderBy: { dateTaken: "desc" },
        take: 8,
      }),
      db.vitalRecord.findMany({
        where: { userId: ownerUserId },
        orderBy: { recordedAt: "desc" },
        take: 10,
      }),
      db.medicalDocument.findMany({
        where: { userId: ownerUserId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.aiInsight.findFirst({
        where: { ownerUserId },
        orderBy: { createdAt: "desc" },
      }),
      db.careAccess.findMany({
        where: {
          ownerUserId,
          status: "ACTIVE",
        },
        include: {
          member: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const trendFlags = parseJsonArray<{ type: string; severity: string; message: string }>(
    latestInsight?.trendFlagsJson ?? null
  );
  const suggestedQuestions = parseJsonArray<string>(latestInsight?.suggestedQuestionsJson ?? null);
  const recommendedFollowUp = parseJsonArray<string>(latestInsight?.recommendedFollowUpJson ?? null);

  const displayName = owner?.healthProfile?.fullName ?? owner?.name ?? "Patient";

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{displayName}</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Shared patient workspace
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Access mode: {access.accessRole}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/care-team"
                className="rounded-xl border px-4 py-2 text-sm font-medium"
              >
                Back to care team
              </Link>

              {access.canGenerateAIInsights ? (
                <form action={generatePatientInsightAction}>
                  <input type="hidden" name="ownerUserId" value={ownerUserId} />
                  <button
                    type="submit"
                    className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    Generate AI insight
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Patient overview</h2>
              <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <p><span className="font-medium">Email:</span> {owner?.email ?? "—"}</p>
                <p><span className="font-medium">Date of birth:</span> {owner?.healthProfile?.dateOfBirth?.toLocaleDateString() ?? "—"}</p>
                <p><span className="font-medium">Sex:</span> {owner?.healthProfile?.sex ?? "—"}</p>
                <p><span className="font-medium">Blood type:</span> {owner?.healthProfile?.bloodType ?? "—"}</p>
                <p><span className="font-medium">Height:</span> {owner?.healthProfile?.heightCm ?? "—"} cm</p>
                <p><span className="font-medium">Weight:</span> {owner?.healthProfile?.weightKg ?? "—"} kg</p>
                <p><span className="font-medium">Emergency contact:</span> {owner?.healthProfile?.emergencyContactName ?? "—"}</p>
                <p><span className="font-medium">Emergency phone:</span> {owner?.healthProfile?.emergencyContactPhone ?? "—"}</p>
                <p className="md:col-span-2"><span className="font-medium">Allergies:</span> {owner?.healthProfile?.allergiesSummary ?? "—"}</p>
                <p className="md:col-span-2"><span className="font-medium">Chronic conditions:</span> {owner?.healthProfile?.chronicConditions ?? "—"}</p>
                <p className="md:col-span-2"><span className="font-medium">Notes:</span> {owner?.healthProfile?.notes ?? "—"}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Medications</h2>
              <div className="mt-5 space-y-4">
                {medications.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No medications recorded.</p>
                ) : (
                  medications.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-medium">
                        {item.name} · {item.dosage} · {item.frequency}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Doctor: {item.doctor?.name ?? "—"} · Status: {item.status}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Schedule: {item.schedules.map((s) => s.timeOfDay).join(", ") || "—"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Appointments</h2>
              <div className="mt-5 space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No appointments recorded.</p>
                ) : (
                  appointments.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-medium">{item.purpose}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.doctorName} · {item.clinic} · {item.scheduledAt.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Status: {item.status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Latest AI insight</h2>
              {latestInsight ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border p-4">
                    <p className="font-medium">{latestInsight.title}</p>
                    <p className="mt-2 text-sm">{latestInsight.summary}</p>
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                      Adherence risk: {latestInsight.adherenceRisk}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      Generated: {latestInsight.createdAt.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="font-medium">Trend flags</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                      {trendFlags.length ? (
                        trendFlags.map((flag, idx) => (
                          <li key={`${flag.type}-${idx}`}>
                            [{flag.severity}] {flag.message}
                          </li>
                        ))
                      ) : (
                        <li>No trend flags.</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="font-medium">Suggested questions</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                      {suggestedQuestions.length ? (
                        suggestedQuestions.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)
                      ) : (
                        <li>No suggested questions.</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="font-medium">Recommended follow-up</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                      {recommendedFollowUp.length ? (
                        recommendedFollowUp.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)
                      ) : (
                        <li>No follow-up suggestions.</li>
                      )}
                    </ul>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {latestInsight.disclaimer}
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
                  No AI insight has been generated yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Recent labs</h2>
              <div className="mt-5 space-y-4">
                {labs.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No lab results recorded.</p>
                ) : (
                  labs.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-medium">{item.testName}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.dateTaken.toLocaleDateString()} · {item.flag}
                      </p>
                      <p className="mt-1 text-sm">{item.resultSummary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Recent vitals</h2>
              <div className="mt-5 space-y-4">
                {vitals.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No vital records recorded.</p>
                ) : (
                  vitals.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4 text-sm">
                      <p className="font-medium">{item.recordedAt.toLocaleString()}</p>
                      <p className="mt-1">BP: {bpLabel(item.systolic, item.diastolic)}</p>
                      <p>Heart rate: {item.heartRate ?? "—"}</p>
                      <p>Blood sugar: {item.bloodSugar ?? "—"}</p>
                      <p>Weight: {item.weightKg ?? "—"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Documents</h2>
              <div className="mt-5 space-y-4">
                {documents.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No documents uploaded.</p>
                ) : (
                  documents.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.type} · {item.fileName}
                      </p>
                      <a
                        href={item.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-xl border px-3 py-2 text-sm font-medium"
                      >
                        Open file
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Active care team</h2>
              <div className="mt-5 space-y-4">
                {careTeam.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No active care team members.</p>
                ) : (
                  careTeam.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <p className="font-medium">{item.member.name ?? item.member.email}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.member.email} · {item.accessRole}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}