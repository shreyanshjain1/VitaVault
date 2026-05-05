import { DemoHeader, DemoSection, ProgressBar, SimpleTable, ToneBadge } from "@/components/demo-primitives";
import { demoLabReviewHub } from "@/lib/demo-data";

export default function DemoLabReviewPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Clinical review" title="Lab Review demo" description="Lab readiness, abnormal/borderline flag review, trend cards, document coverage, and provider handoff context." />
      <DemoSection title="Lab readiness"><ProgressBar value={demoLabReviewHub.readiness} label="Lab review readiness" /></DemoSection>
      <DemoSection title="Flag breakdown"><SimpleTable headers={["Flag", "Count", "Context"]} rows={demoLabReviewHub.breakdown.map((item) => [<ToneBadge key={item.flag} value={item.flag} />, item.count, item.note])} /></DemoSection>
      <DemoSection title="Trend cards"><SimpleTable headers={["Test", "Latest", "Previous", "Status"]} rows={demoLabReviewHub.trendCards.map((item) => [item.test, item.latest, item.previous, <ToneBadge key={item.test} value={item.status} />])} /></DemoSection>
    </div>
  );
}
