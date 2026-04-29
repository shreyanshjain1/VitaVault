import { BulletList, DemoHeader, DemoSection, MetricGrid, StatCards } from "@/components/demo-primitives";
import { demoAiInsights } from "@/lib/demo-data";

export default function DemoAiInsightsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="AI support" title="AI Insights" description="See how trends, risks, and next-step suggestions can be surfaced from the patient record in a calm, readable way." />
      <MetricGrid items={[
        { label: "Insight cards", value: String(demoAiInsights.length), note: "Positive, monitor, and action framing" },
        { label: "Linked modules", value: "5", note: "Labs, symptoms, reminders, summary, alerts" },
        { label: "Latest generation", value: "Today", note: "Would normally be user-triggered or scheduled" },
        { label: "Patient scope", value: "Single owner", note: "Mirrors secure per-patient insight workflow" },
      ]} />
      <DemoSection title="Generated insight cards">
        <StatCards items={demoAiInsights.map((item) => ({ title: item.title, body: item.summary, status: item.severity }))} />
      </DemoSection>
      <DemoSection title="How the real flow behaves">
        <BulletList items={[
          "Users can generate or refresh insight snapshots on demand.",
          "Shared patient views can expose relevant insights to approved caregivers or clinicians.",
          "Insights often point directly to reminders, alerts, review queue items, or summary exports.",
        ]} />
      </DemoSection>
    </div>
  );
}
