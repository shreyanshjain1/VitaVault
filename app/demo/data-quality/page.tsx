import Link from "next/link";
import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoDataQuality } from "@/lib/demo-data";

export default function DemoDataQualityPage() {
  return (
    <div className="space-y-6">
      <DemoHeader
        eyebrow="Care workflow"
        title="Data Quality Center"
        description="A read-only preview of the cleanup workspace that helps patients and care teams improve profile completeness, record freshness, safety review, device sync health, export readiness, and collaboration quality before sharing reports."
        actions={<><Link href="/data-quality" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open live app route</Link><Link href="/demo/device-connection" className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">Review device demo</Link></>}
      />
      <MetricGrid items={[{ label: "Overall quality", value: `${demoDataQuality.score}%`, note: "Computed from profile, records, safety, devices, exports, and collaboration" }, { label: "Sections", value: String(demoDataQuality.sections.length), note: "Quality areas with independent scores" }, { label: "Top actions", value: String(demoDataQuality.actions.length), note: "Prioritized cleanup queue" }, { label: "Demo mode", value: "Read-only", note: "Uses sample data for reviewer flow" }]} />
      <DemoSection title="Quality section summary" description="The live route computes this from the signed-in user database. This demo mirrors the intended reviewer story with sample data."><SimpleTable headers={["Section", "Score", "Finding", "Status"]} rows={demoDataQuality.sections.map((section) => [section.name, section.score, section.issue, section.status])} /></DemoSection>
      <DemoSection title="Recommended cleanup queue" description="The center turns noisy record gaps into practical next actions that link to the correct VitaVault module."><StatCards items={demoDataQuality.actions.map((action) => ({ title: action.title, body: action.detail, status: action.priority }))} /></DemoSection>
    </div>
  );
}
