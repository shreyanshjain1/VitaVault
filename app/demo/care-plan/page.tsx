import { DemoHeader, DemoSection, ProgressBar, SimpleTable, TimelineList, ToneBadge } from "@/components/demo-primitives";
import { demoCarePlanHub } from "@/lib/demo-data";

export default function DemoCarePlanPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Care workflow" title="Care Plan Hub demo" description="A care-plan workspace that turns alerts, reminders, labs, symptoms, medications, and profile gaps into prioritized next steps." />
      <DemoSection title="Care-plan readiness">
        <ProgressBar value={demoCarePlanHub.readiness} label="Care plan readiness" />
      </DemoSection>
      <DemoSection title="Prioritized action list">
        <SimpleTable headers={["Action", "Priority", "Owner", "Detail"]} rows={demoCarePlanHub.actions.map((item) => [item.title, <ToneBadge key={item.title} value={item.priority} />, item.owner, item.detail])} />
      </DemoSection>
      <DemoSection title="Upcoming care timeline">
        <TimelineList items={demoCarePlanHub.timeline} />
      </DemoSection>
    </div>
  );
}
