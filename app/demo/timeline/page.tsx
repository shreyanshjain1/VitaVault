import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoTimeline } from "@/lib/demo-data";

export default function DemoTimelinePage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Unified history" title="Timeline" description="A public mirror of VitaVault’s cross-module patient timeline, combining reminders, labs, appointments, and alert events into one longitudinal view." />
      <MetricGrid items={[
        { label: "Events shown", value: String(demoTimeline.length), note: "Cross-module activity" },
        { label: "Sources", value: "4", note: "Reminder, alert, lab, appointment" },
        { label: "Latest event", value: demoTimeline[0].type, note: demoTimeline[0].at },
        { label: "Deep links", value: "Previewed", note: "Real app uses record focus routing" },
      ]} />
      <DemoSection title="Timeline feed">
        <SimpleTable headers={["When", "Type", "Title", "Detail"]} rows={demoTimeline.map((item) => [item.at, item.type, item.title, item.detail])} />
      </DemoSection>
      <DemoSection title="Why the timeline matters">
        <StatCards items={demoTimeline.map((item) => ({ title: item.title, body: item.detail, status: item.type }))} />
      </DemoSection>
    </div>
  );
}
