import { AutoPrintOnLoad } from "@/components/auto-print-on-load";
import { StatusPill } from "@/components/common";
import { getReportBuilderData, isSectionSelected, type ReportTimelineItem } from "@/lib/report-builder";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function PrintRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-950">{value || "—"}</p>
    </div>
  );
}

function PrintTimelineItem({ item }: { item: ReportTimelineItem }) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <StatusPill tone={item.risk === "urgent" ? "danger" : item.risk === "watch" ? "warning" : "neutral"}>{item.risk}</StatusPill>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">{item.type}</span>
          </div>
          <h3 className="font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
        </div>
        <p className="whitespace-nowrap text-right text-xs text-slate-500">{formatDateTime(item.occurredAt)}</p>
      </div>
    </div>
  );
}

export default async function ReportBuilderPrintPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const preset = typeof params.preset === "string" ? params.preset : undefined;
  const reportType = typeof params.type === "string" ? params.type : "patient";
  const sections = Array.isArray(params.sections) ? params.sections.join(",") : typeof params.sections === "string" ? params.sections : undefined;
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const autoprint = params.autoprint === "1";
  const data = await getReportBuilderData({ preset, reportType, sections, from, to });

  return (
    <main className="min-h-screen bg-white p-8 text-slate-950 print:p-0">
      {autoprint ? <AutoPrintOnLoad /> : null}
      <div className="mx-auto max-w-5xl space-y-8 print:max-w-none">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">VitaVault</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{data.reportTitle}</h1>
              <p className="mt-2 text-sm text-slate-600">Generated {formatDateTime(new Date())} • {data.range.label}</p>
              {data.selectedPreset ? <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Preset: {data.selectedPreset.label}</p> : null}
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>{data.summary.selectedSectionCount} sections selected</p>
              <p>{data.summary.totalRecords} source records • {data.summary.readinessScore}% ready</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <PrintRow label="Readiness" value={`${data.summary.readinessScore}%`} />
          <PrintRow label="High-risk alerts" value={data.summary.highRiskAlerts} />
          <PrintRow label="Abnormal labs" value={data.summary.abnormalLabs} />
          <PrintRow label="Document links" value={`${data.summary.documentLinkRate}%`} />
        </section>

        {isSectionSelected(data.selectedSections, "profile") ? (
          <section className="break-inside-avoid space-y-3">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">Profile and emergency context</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PrintRow label="Full name" value={data.profile?.fullName} />
              <PrintRow label="Date of birth" value={formatDate(data.profile?.dateOfBirth)} />
              <PrintRow label="Blood type" value={data.profile?.bloodType} />
              <PrintRow label="Emergency contact" value={[data.profile?.emergencyContactName, data.profile?.emergencyContactPhone].filter(Boolean).join(" • ")} />
              <PrintRow label="Allergies" value={data.profile?.allergiesSummary} />
              <PrintRow label="Chronic conditions" value={data.profile?.chronicConditions} />
            </div>
          </section>
        ) : null}

        {isSectionSelected(data.selectedSections, "medications") ? (
          <section className="break-inside-avoid space-y-3">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">Medications</h2>
            <div className="space-y-3">
              {data.medications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold">{item.name} • {item.dosage}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.frequency}{item.doctor ? ` • ${item.doctor.name}` : ""}</p>
                  <p className="mt-1 text-sm text-slate-600">Schedule: {item.schedules.map((schedule) => schedule.timeOfDay).join(", ") || "No schedule listed"}</p>
                </div>
              ))}
              {!data.medications.length ? <p className="text-sm text-slate-500">No active medications found.</p> : null}
            </div>
          </section>
        ) : null}

        {isSectionSelected(data.selectedSections, "labs") ? (
          <section className="break-inside-avoid space-y-3">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">Labs</h2>
            <div className="space-y-3">
              {data.labs.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold">{item.testName}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.flag} • {item.resultSummary}</p>
                  <p className="mt-1 text-xs text-slate-500">Taken {formatDate(item.dateTaken)}{item.referenceRange ? ` • Ref: ${item.referenceRange}` : ""}</p>
                </div>
              ))}
              {!data.labs.length ? <p className="text-sm text-slate-500">No labs found for this range.</p> : null}
            </div>
          </section>
        ) : null}


        {isSectionSelected(data.selectedSections, "careNotes") ? (
          <section className="break-inside-avoid space-y-3">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">Care notes</h2>
            <div className="space-y-3">
              {data.careNotes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <StatusPill tone={item.priority === "URGENT" ? "danger" : item.priority === "HIGH" ? "warning" : item.priority === "LOW" ? "neutral" : "info"}>{item.priority}</StatusPill>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">{item.category.replaceAll("_", " ")}</span>
                    {item.pinned ? <StatusPill tone="warning">Pinned</StatusPill> : null}
                  </div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{item.body}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.visibility} • {formatDateTime(item.createdAt)} • {item.author.name || item.author.email || "Care team"}</p>
                </div>
              ))}
              {!data.careNotes.length ? <p className="text-sm text-slate-500">No care notes found for this range.</p> : null}
            </div>
          </section>
        ) : null}

        {isSectionSelected(data.selectedSections, "timeline") ? (
          <section className="break-inside-avoid space-y-3">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">Timeline preview</h2>
            <div className="space-y-3">
              {data.timeline.map((item) => <PrintTimelineItem key={item.id} item={item} />)}
              {!data.timeline.length ? <p className="text-sm text-slate-500">No timeline events found for this report range.</p> : null}
            </div>
          </section>
        ) : null}

        <section className="break-inside-avoid rounded-2xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold">Recommended pre-share checks</h2>
          <div className="mt-3 space-y-2">
            {data.actionItems.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-3">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>This report is generated from VitaVault records and should be reviewed by the user before sharing with a care provider or caregiver.</p>
        </footer>
      </div>
    </main>
  );
}
