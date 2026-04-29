import type { ReactNode } from "react";
import { AutoPrintOnLoad } from "@/components/auto-print-on-load";
import { getEmergencyCardData } from "@/lib/emergency-card";
import { requireUser } from "@/lib/session";
import { bpLabel, formatDate, formatDateTime } from "@/lib/utils";

type SearchParams = Promise<{ autoprint?: string }>;

function PrintField({ label, value, urgent = false }: { label: string; value?: ReactNode; urgent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${urgent ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className={`mt-1 text-sm font-semibold ${urgent ? "text-red-700" : "text-slate-950"}`}>{value || "—"}</div>
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 break-inside-avoid">
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function EmergencyCardPrintPage({ searchParams }: { searchParams?: SearchParams }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const autoprint = resolvedSearchParams.autoprint === "1";
  const currentUser = await requireUser();
  const { profile, patientName, medications, doctors, latestVitals, severeSymptoms, criticalProfileItems, generatedAt } = await getEmergencyCardData(currentUser.id!);

  return (
    <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      {autoprint ? <AutoPrintOnLoad /> : null}
      <div className="mx-auto max-w-4xl space-y-4 rounded-[32px] bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="rounded-3xl border-2 border-red-200 bg-red-50 p-5 print:rounded-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">VitaVault Emergency Health Card</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{patientName}</h1>
              <p className="mt-1 text-sm text-slate-700">Generated {formatDateTime(generatedAt)} • Carry with ID or share with a caregiver.</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Emergency contact</p>
              <p className="mt-1 text-base font-bold text-slate-950">{profile?.emergencyContactName ?? "Not documented"}</p>
              <p className="text-sm font-semibold text-red-700">{profile?.emergencyContactPhone ?? "No phone documented"}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <PrintSection title="Critical identity">
            <div className="grid gap-3 sm:grid-cols-2">
              <PrintField label="Date of birth" value={formatDate(profile?.dateOfBirth)} />
              <PrintField label="Sex" value={profile?.sex} />
              <PrintField label="Blood type" value={profile?.bloodType} urgent={!profile?.bloodType} />
              <PrintField label="Height / Weight" value={`${profile?.heightCm ?? "—"} cm / ${profile?.weightKg ?? "—"} kg`} />
            </div>
          </PrintSection>

          <PrintSection title="Latest vitals">
            {latestVitals ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <PrintField label="Recorded" value={formatDateTime(latestVitals.recordedAt)} />
                <PrintField label="Blood pressure" value={bpLabel(latestVitals.systolic, latestVitals.diastolic)} />
                <PrintField label="Heart rate" value={latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : "—"} />
                <PrintField label="Oxygen" value={latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : "—"} />
              </div>
            ) : (
              <p className="text-sm text-slate-600">No vitals recorded yet.</p>
            )}
          </PrintSection>
        </div>

        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <PrintSection title="Allergies">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {profile?.allergiesSummary || "No allergies documented yet."}
            </div>
          </PrintSection>

          <PrintSection title="Chronic conditions">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {profile?.chronicConditions || "No chronic conditions documented yet."}
            </div>
          </PrintSection>
        </div>

        <PrintSection title="Active medications">
          {medications.length ? (
            <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
              {medications.slice(0, 6).map((medication) => (
                <div key={medication.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="font-bold text-slate-950">{medication.name}</p>
                  <p className="text-slate-700">{medication.dosage} • {medication.frequency}</p>
                  {medication.instructions ? <p className="mt-1 text-xs text-slate-500">{medication.instructions}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No active medications documented.</p>
          )}
        </PrintSection>

        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <PrintSection title="Care contacts">
            {doctors.length ? (
              <div className="space-y-2">
                {doctors.slice(0, 3).map((doctor) => (
                  <div key={doctor.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <p className="font-bold text-slate-950">{doctor.name}</p>
                    <p className="text-slate-700">{doctor.specialty ?? "General care"}{doctor.clinic ? ` • ${doctor.clinic}` : ""}</p>
                    <p className="text-slate-600">{doctor.phone ?? doctor.email ?? "No contact listed"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No doctors documented.</p>
            )}
          </PrintSection>

          <PrintSection title="Triage warnings">
            <div className="space-y-2">
              {criticalProfileItems.map((item) => (
                <div key={item} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{item}</div>
              ))}
              {severeSymptoms.map((symptom) => (
                <div key={symptom.id} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                  Severe symptom: {symptom.title} • started {formatDate(symptom.startedAt)}
                </div>
              ))}
              {!criticalProfileItems.length && !severeSymptoms.length ? <p className="text-sm text-slate-600">No triage warnings detected from current records.</p> : null}
            </div>
          </PrintSection>
        </div>

        {profile?.notes ? (
          <PrintSection title="Care notes">
            <p className="whitespace-pre-line text-sm text-slate-700">{profile.notes}</p>
          </PrintSection>
        ) : null}

        <footer className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 print:rounded-none">
          This emergency card is generated from VitaVault records. It is a patient-provided snapshot and should be verified with a licensed clinician during medical care.
        </footer>
      </div>
    </main>
  );
}
