import { BulletList, DemoHeader, DemoSection, MetricGrid, StatCards } from "@/components/demo-primitives";
import { demoSummary, demoPatient, demoCareTeam } from "@/lib/demo-data";

export default function DemoSummaryPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Patient handoff" title="Summary" description="A more app-like version of VitaVault’s patient summary and export handoff page, combining high-level narrative, care-team context, and snapshot highlights." />
      <MetricGrid items={[
        { label: "Patient", value: demoPatient.name, note: `${demoPatient.age} · ${demoPatient.sex}` },
        { label: "Care members", value: String(demoCareTeam.members.length), note: "Included in handoff context" },
        { label: "Open issues", value: "1 neuropathy watch", note: "Surfaced from alerts + symptoms" },
        { label: "Export modes", value: "2", note: "Standard and compact PDF" },
      ]} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DemoSection title="Clinical snapshot">
          <p className="text-sm leading-7 text-muted-foreground">{demoSummary.snapshot}</p>
        </DemoSection>
        <DemoSection title="Top highlights">
          <BulletList items={demoSummary.highlights} />
        </DemoSection>
      </div>
      <DemoSection title="How this mirrors the real app">
        <StatCards items={[
          { title: "Printable export", body: "The authenticated product provides browser-native PDF workflows and compact print modes from this same summary concept.", status: "Ready" },
          { title: "AI + care context", body: "The real summary pulls in AI insight, access snapshot, alert posture, and linked records for handoff quality.", status: "Enhanced" },
          { title: "Shareable snapshot", body: "Teams use this page to hand off care status across appointments, caregivers, and admin operations.", status: "Business-ready" },
        ]} />
      </DemoSection>
    </div>
  );
}
