import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoTimeline } from "@/lib/demo-data";

export default function DemoTimelinePage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Unified Timeline" description="Cross-module chronology tying together reminders, labs, alerts, and visits." />
      <DemoSection title="Patient activity timeline">
        <SimpleTable headers={["When", "Type", "Title", "Detail"]} rows={demoTimeline.map((item) => [item.at, item.type, item.title, item.detail])} />
      </DemoSection>
    </div>
  );
}
