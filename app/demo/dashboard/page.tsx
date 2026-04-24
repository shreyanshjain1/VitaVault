import { DemoHeader, DemoSection, MetricGrid, SimpleTable } from "@/components/demo-primitives";
import { demoDashboardStats, demoTimeline, demoReminders } from "@/lib/demo-data";

export default function DemoDashboardPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Dashboard" description="A premium at-a-glance overview of patient health, outstanding tasks, and recent events." />
      <MetricGrid items={demoDashboardStats} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Recent timeline">
          <SimpleTable headers={["When", "Type", "Title", "Detail"]} rows={demoTimeline.map((item) => [item.at, item.type, item.title, item.detail])} />
        </DemoSection>
        <DemoSection title="Reminder center snapshot">
          <SimpleTable headers={["Reminder", "When", "Channel", "State"]} rows={demoReminders.map((item) => [item.title, item.when, item.channel, item.state])} />
        </DemoSection>
      </div>
    </div>
  );
}
