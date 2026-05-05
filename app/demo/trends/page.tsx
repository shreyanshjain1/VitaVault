import { DemoHeader, DemoSection, MetricGrid, SimpleTable, ToneBadge } from "@/components/demo-primitives";
import { demoTrendsHub } from "@/lib/demo-data";

export default function DemoTrendsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Clinical review" title="Health Trends demo" description="A read-only analytics preview for vitals, labs, symptoms, medication adherence, and merged health timeline signals." />
      <MetricGrid items={demoTrendsHub.metrics} />
      <DemoSection title="Trend cards">
        <SimpleTable headers={["Metric", "Latest", "Previous", "Direction", "Review note"]} rows={demoTrendsHub.trends.map((item) => [item.metric, item.latest, item.previous, <ToneBadge key={item.metric} value={item.direction} />, item.note])} />
      </DemoSection>
    </div>
  );
}
