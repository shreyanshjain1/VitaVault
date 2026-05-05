import { DemoHeader, DemoSection, ProgressBar, SimpleTable, ToneBadge } from "@/components/demo-primitives";
import { demoSymptomReviewHub } from "@/lib/demo-data";

export default function DemoSymptomReviewPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Clinical review" title="Symptom Review demo" description="Severity breakdown, unresolved metrics, body-area clusters, symptom action queue, and provider handoff signals." />
      <DemoSection title="Symptom readiness"><ProgressBar value={demoSymptomReviewHub.readiness} label="Symptom review readiness" /></DemoSection>
      <DemoSection title="Severity breakdown"><SimpleTable headers={["Severity", "Count", "Status"]} rows={demoSymptomReviewHub.severity.map((item) => [item.severity, item.count, <ToneBadge key={item.severity} value={item.status} />])} /></DemoSection>
      <DemoSection title="Body-area clusters"><SimpleTable headers={["Area", "Count", "Signal"]} rows={demoSymptomReviewHub.clusters.map((item) => [item.area, item.count, <ToneBadge key={item.area} value={item.signal} />])} /></DemoSection>
    </div>
  );
}
