import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoReviewQueue } from "@/lib/demo-data";

export default function DemoReviewQueuePage() {
  const headers = ["Item", "Source", "Tone", "Owner", "Status"];
  const rows = demoReviewQueue.map((item) => [item.item, item.source, item.tone, item.owner, item.status]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Review Queue" description="Items surfaced for clinical follow-up, caregiver action, and admin handoff." />
      <DemoSection title="Review workload">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
