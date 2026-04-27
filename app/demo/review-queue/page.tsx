import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoReviewQueue } from "@/lib/demo-data";

export default function DemoReviewQueuePage() {
  const headers = ["Item", "Source", "Tone", "Owner", "Status"];
  const rows = demoReviewQueue.map((item, index) => ({
    key: `${item.item}-${index}`,
    cells: [item.item, item.source, item.tone, item.owner, item.status],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Review Queue"
        description="A straightforward view of the items that need attention, follow-up, or escalation across the record."
      />
      <DemoSection title="Review workload" description="Useful for explaining how the app brings alerts, reminders, and records together for action.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
