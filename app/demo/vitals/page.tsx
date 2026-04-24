import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoVitals } from "@/lib/demo-data";

export default function DemoVitalsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Vitals" description="Trend-friendly vitals tracking for chronic-care follow-up and review." />
      <DemoSection title="Current vitals snapshot">
        <SimpleTable headers={["Metric", "Latest", "Range", "Notes"]} rows={demoVitals.map((item) => [item.metric, item.latest, item.range, item.note])} />
      </DemoSection>
    </div>
  );
}
