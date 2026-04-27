import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoJobs } from "@/lib/demo-data";

export default function DemoJobsPage() {
  const headers = ["Job", "Queue", "Status", "When"];
  const rows = demoJobs.map((item, index) => ({
    key: `${item.job}-${index}`,
    cells: [item.job, item.queue, item.status, item.at],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Jobs"
        description="A light operational view of background work like reminders, alert scans, and other scheduled processes."
      />
      <DemoSection title="Recent job runs" description="Shows the kind of queue visibility an admin or operator would expect.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
