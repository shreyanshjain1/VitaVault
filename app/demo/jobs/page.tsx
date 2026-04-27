import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoJobs } from "@/lib/demo-data";

export default function DemoJobsPage() {
  const headers = ["Job", "Queue", "Status", "When"];
  const rows = demoJobs.map((item) => [item.job, item.queue, item.status, item.at]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Jobs" description="Background processing visibility for alert scans, reminders, and sync workflows." />
      <DemoSection title="Recent job runs">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
