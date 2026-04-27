import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoVitals } from "@/lib/demo-data";

export default function DemoVitalsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Vital trends" title="Vitals" description="Review blood pressure, glucose, weight, and other tracked readings with the kind of trend context the app uses every day." />
      <MetricGrid items={demoVitals.map((item) => ({ label: item.metric, value: item.latest, note: item.range }))} />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DemoSection title="Trend summary table">
          <SimpleTable headers={["Metric", "Latest", "Range", "Commentary"]} rows={demoVitals.map((item) => [item.metric, item.latest, item.range, item.note])} />
        </DemoSection>
        <DemoSection title="Clinical meaning">
          <StatCards items={demoVitals.map((item) => ({ title: item.metric, body: item.note, status: item.metric === "Fasting Glucose" ? "Watch" : "Stable" }))} />
        </DemoSection>
      </div>
    </div>
  );
}
