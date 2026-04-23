import type { ReactNode } from "react";
import { AutoPrintOnLoad } from "@/components/auto-print-on-load";
import { getPatientSummaryData } from "@/lib/patient-summary";
import { requireUser } from "@/lib/session";
import { bpLabel, formatDate, formatDateTime } from "@/lib/utils";

type SearchParams = Promise<{
  autoprint?: string;
  mode?: string;
}>;

function LineItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 border-b border-slate-200 py-2 text-sm">
      <div className="font-medium text-slate-600">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function Section({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white ${compact ? "p-4" : "p-5"}`}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className={`mt-3 ${compact ? "space-y-2" : "space-y-2"}`}>{children}</div>
    </section>
  );
}

function RecordCard({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-200 text-sm ${compact ? "p-2.5" : "p-3"}`}>
      {children}
    </div>
  );
}

export default async function SummaryPrintPage({ searchParams }: { searchParams?: SearchParams }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await requireUser();
  const {
    generatedAt,
    profile,
    meds,
    appointments,
    labs,
    vitals,
    symptoms,
    vaccinations,
    reminders,
    docs,
    alerts,
    stats,
    latestInsight,
    careAccess,
  } = await getPatientSummaryData(user.id!);

  const compact = resolvedSearchParams.mode === "compact";
  const autoprint = resolvedSearchParams.autoprint === "1";
  const visibleReminders = compact ? reminders.slice(0, 5) : reminders;
  const visibleDocs = compact ? docs.slice(0, 5) : docs;
  const visibleAlerts = compact ? alerts.slice(0, 5) : alerts;

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">
      {autoprint ? <AutoPrintOnLoad /> : null}
      <div className={`mx-auto space-y-6 p-6 print:max-w-none print:p-0 ${compact ? "max-w-4xl" : "max-w-5xl"}`}>
        <header className="rounded-3xl border border-slate-200 bg-white p-6 print:rounded-none print:border-x-0 print:border-t-0">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">VitaVault</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Patient Summary</h1>
              <p className="mt-2 text-sm text-slate-600">Prepared for print / Save as PDF on {formatDateTime(generatedAt)}</p>
              <p className="mt-1 text-sm text-slate-600">Mode: {compact ? "Compact handoff view" : "Standard detailed view"}</p>
              <p className="mt-1 text-sm text-slate-600">Prepared by {user.name ?? user.email ?? "Signed-in user"}</p>
            </div>
            <div className={`grid gap-3 text-right text-sm ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Alerts</div>
                <div className="mt-1 text-2xl font-semibold">{stats.alerts}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Reminders</div>
                <div className="mt-1 text-2xl font-semibold">{stats.reminders}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Docs</div>
                <div className="mt-1 text-2xl font-semibold">{stats.documents}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Care</div>
                <div className="mt-1 text-2xl font-semibold">{stats.careMembers}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <Section title="Patient profile" compact={compact}>
            <LineItem label="Full name" value={profile?.fullName ?? user.name ?? "—"} />
            <LineItem label="Date of birth" value={formatDate(profile?.dateOfBirth)} />
            <LineItem label="Sex" value={profile?.sex ?? "—"} />
            <LineItem label="Blood type" value={profile?.bloodType ?? "—"} />
            <LineItem label="Height / Weight" value={`${profile?.heightCm ?? "—"} cm / ${profile?.weightKg ?? "—"} kg`} />
            <LineItem label="Emergency contact" value={profile?.emergencyContactName ?? "—"} />
            <LineItem label="Emergency phone" value={profile?.emergencyContactPhone ?? "—"} />
            <LineItem label="Allergies" value={profile?.allergiesSummary ?? "—"} />
            <LineItem label="Chronic conditions" value={profile?.chronicConditions ?? "—"} />
            <LineItem label="Notes" value={profile?.notes ?? "—"} />
          </Section>

          <Section title="Export snapshot" compact={compact}>
            <LineItem label="Prepared" value={formatDateTime(generatedAt)} />
            <LineItem label="Prepared by" value={user.name ?? user.email ?? "Signed-in user"} />
            <LineItem label="Mode" value={compact ? "Compact handoff view" : "Standard detailed view"} />
            <LineItem label="AI insight" value={latestInsight ? latestInsight.title : "No generated insight included"} />
            <LineItem label="Active care access" value={`${stats.careMembers} active member${stats.careMembers === 1 ? "" : "s"}`} />
          </Section>
        </div>

        {latestInsight ? (
          <Section title="Latest AI insight" compact={compact}>
            <p className="text-sm font-semibold text-slate-900">{latestInsight.title}</p>
            <p className="mt-2 text-sm text-slate-600">{latestInsight.summary}</p>
            <p className="mt-2 text-xs text-slate-500">Generated {formatDateTime(latestInsight.createdAt)}</p>
          </Section>
        ) : null}

        {careAccess.length ? (
          <Section title="Care-team access snapshot" compact={compact}>
            <div className="grid gap-3 md:grid-cols-2">
              {careAccess.map((member) => (
                <RecordCard key={member.id} compact={compact}>
                  <p className="font-semibold text-slate-900">{member.member.name ?? member.member.email ?? "Care team member"}</p>
                  <p className="mt-1 text-slate-600">{member.accessRole} • {member.status}</p>
                  <p className="text-slate-600">Export {member.canExport ? "enabled" : "disabled"} • Edit {member.canEditRecords ? "enabled" : "disabled"}</p>
                </RecordCard>
              ))}
            </div>
          </Section>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Medications" compact={compact}>
            {meds.length ? meds.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-slate-600">{item.dosage} • {item.frequency}</p>
                <p className="text-slate-600">Times: {item.schedules.map((schedule) => schedule.timeOfDay).join(", ") || "—"}</p>
                <p className="text-slate-600">Start {formatDate(item.startDate)} • End {formatDate(item.endDate)}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No medications available.</p>}
          </Section>

          <Section title="Appointments" compact={compact}>
            {appointments.length ? appointments.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.purpose}</p>
                <p className="mt-1 text-slate-600">{item.doctorName} • {item.clinic}</p>
                <p className="text-slate-600">{formatDateTime(item.scheduledAt)} • {item.status}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No appointments available.</p>}
          </Section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Recent labs" compact={compact}>
            {labs.length ? labs.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.testName}</p>
                <p className="mt-1 text-slate-600">{formatDate(item.dateTaken)} • {item.flag}</p>
                <p className="text-slate-600">{item.resultSummary}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No labs available.</p>}
          </Section>

          <Section title="Recent vitals" compact={compact}>
            {vitals.length ? vitals.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{formatDateTime(item.recordedAt)}</p>
                <p className="mt-1 text-slate-600">BP {bpLabel(item.systolic, item.diastolic)} • HR {item.heartRate ?? "—"}</p>
                <p className="text-slate-600">Blood sugar {item.bloodSugar ?? "—"} • O₂ {item.oxygenSaturation ?? "—"}</p>
                <p className="text-slate-600">Temp {item.temperatureC ?? "—"} • Weight {item.weightKg ?? "—"}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No vitals available.</p>}
          </Section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Symptoms & vaccinations" compact={compact}>
            {symptoms.length ? symptoms.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.severity} • {formatDateTime(item.startedAt)}</p>
                <p className="text-slate-600">{item.notes ?? (item.resolved ? "Marked resolved." : "No notes provided.")}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No symptoms available.</p>}

            {vaccinations.length ? vaccinations.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.vaccineName}</p>
                <p className="mt-1 text-slate-600">Dose {item.doseNumber} • {formatDate(item.dateTaken)}</p>
                <p className="text-slate-600">Next due {formatDate(item.nextDueDate)}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No vaccinations available.</p>}
          </Section>

          <Section title="Reminders, documents, and alerts" compact={compact}>
            {visibleReminders.length ? visibleReminders.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{formatDateTime(item.dueAt)} • {item.state}</p>
                {!compact ? <p className="text-slate-600">{item.description ?? "No reminder description."}</p> : null}
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No reminders available.</p>}

            {visibleDocs.length ? visibleDocs.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.type} • {item.fileName}</p>
                <p className="text-slate-600">Added {formatDateTime(item.createdAt)}</p>
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No documents available.</p>}

            {visibleAlerts.length ? visibleAlerts.map((item) => (
              <RecordCard key={item.id} compact={compact}>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.severity} • {item.status}</p>
                {!compact ? <p className="text-slate-600">{item.message}</p> : null}
              </RecordCard>
            )) : <p className="text-sm text-slate-500">No alerts available.</p>}
          </Section>
        </div>

        <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 print:rounded-none print:border-x-0 print:border-b-0">
          This export is scoped to the signed-in patient workspace and is intended for controlled handoff, review, or browser Save as PDF workflows.
        </footer>
      </div>
    </main>
  );
}
