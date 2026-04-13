import type { ReactNode } from "react";
import { AutoPrintOnLoad } from "@/components/auto-print-on-load";
import { getPatientSummaryData } from "@/lib/patient-summary";
import { requireUser } from "@/lib/session";
import { bpLabel, formatDate, formatDateTime } from "@/lib/utils";

function LineItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 border-b border-slate-200 py-2 text-sm">
      <div className="font-medium text-slate-600">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

export default async function SummaryPrintPage() {
  const user = await requireUser();
  const { profile, meds, appointments, labs, vitals, symptoms, vaccinations, reminders, docs, alerts, stats } = await getPatientSummaryData(user.id!);

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">
      <AutoPrintOnLoad />
      <div className="mx-auto max-w-5xl space-y-6 p-6 print:max-w-none print:p-0">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 print:rounded-none print:border-x-0 print:border-t-0">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">VitaVault</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Patient Summary</h1>
              <p className="mt-2 text-sm text-slate-600">Prepared for print / Save as PDF on {formatDate(new Date())}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-right text-sm">
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Alerts</div>
                <div className="mt-1 text-2xl font-semibold">{stats.alerts}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Reminders</div>
                <div className="mt-1 text-2xl font-semibold">{stats.reminders}</div>
              </div>
            </div>
          </div>
        </header>

        <Section title="Patient profile">
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

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Medications">
            {meds.length ? meds.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-slate-600">{item.dosage} • {item.frequency}</p>
                <p className="text-slate-600">Times: {item.schedules.map((schedule) => schedule.timeOfDay).join(", ") || "—"}</p>
                <p className="text-slate-600">Start {formatDate(item.startDate)} • End {formatDate(item.endDate)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No medications available.</p>}
          </Section>

          <Section title="Appointments">
            {appointments.length ? appointments.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.purpose}</p>
                <p className="mt-1 text-slate-600">{item.doctorName} • {item.clinic}</p>
                <p className="text-slate-600">{formatDateTime(item.scheduledAt)} • {item.status}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No appointments available.</p>}
          </Section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Recent labs">
            {labs.length ? labs.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.testName}</p>
                <p className="mt-1 text-slate-600">{formatDate(item.dateTaken)} • {item.flag}</p>
                <p className="text-slate-600">{item.resultSummary}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No labs available.</p>}
          </Section>

          <Section title="Recent vitals">
            {vitals.length ? vitals.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{formatDateTime(item.recordedAt)}</p>
                <p className="mt-1 text-slate-600">BP {bpLabel(item.systolic, item.diastolic)} • HR {item.heartRate ?? "—"}</p>
                <p className="text-slate-600">Blood sugar {item.bloodSugar ?? "—"} • O₂ {item.oxygenSaturation ?? "—"}</p>
                <p className="text-slate-600">Temp {item.temperatureC ?? "—"} • Weight {item.weightKg ?? "—"}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No vitals available.</p>}
          </Section>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Symptoms & vaccinations">
            {symptoms.length ? symptoms.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.severity} • {formatDateTime(item.startedAt)}</p>
                <p className="text-slate-600">{item.notes ?? (item.resolved ? "Marked resolved." : "No notes provided.")}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No symptoms available.</p>}

            {vaccinations.length ? vaccinations.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.vaccineName}</p>
                <p className="mt-1 text-slate-600">Dose {item.doseNumber} • {formatDate(item.dateTaken)}</p>
                <p className="text-slate-600">Next due {formatDate(item.nextDueDate)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No vaccinations available.</p>}
          </Section>

          <Section title="Reminders, documents, and alerts">
            {reminders.length ? reminders.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{formatDateTime(item.dueAt)} • {item.state}</p>
                <p className="text-slate-600">{item.description ?? "No reminder description."}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No reminders available.</p>}

            {docs.length ? docs.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.type} • {item.fileName}</p>
                <p className="text-slate-600">Added {formatDateTime(item.createdAt)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No documents available.</p>}

            {alerts.length ? alerts.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.severity} • {item.status}</p>
                <p className="text-slate-600">{item.message}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No alerts available.</p>}
          </Section>
        </div>
      </div>
    </main>
  );
}
