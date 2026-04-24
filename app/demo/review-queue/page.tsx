import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoReviewQueue } from "@/lib/demo-data";

export default function DemoReviewQueuePage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Review Queue" description="Items surfaced for clinical follow-up, caregiver action, and admin handoff." />
      <DemoSection title="Review workload">
        <SimpleTable headers={["Item", "Source", "Tone", "Owner", "Status"]} rows={demoReviewQueue.map((item) => [item.item, item.source, item.tone, item.owner, item.status])} />
      </DemoSection>
    </div>
  );
}
