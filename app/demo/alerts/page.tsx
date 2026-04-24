import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoAlerts } from "@/lib/demo-data";

export default function DemoAlertsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Alert Center" description="Threshold rules, event statuses, categories, and review context." />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Alert events">
          <SimpleTable headers={["Title", "Severity", "Status", "Category", "Source", "Created"]} rows={demoAlerts.events.map((item) => [item.title, item.severity, item.status, item.category, item.source, item.createdAt])} />
        </DemoSection>
        <DemoSection title="Alert rules">
          <SimpleTable headers={["Rule", "Category", "Severity", "Status"]} rows={demoAlerts.rules.map((item) => [item.name, item.category, item.severity, item.status])} />
        </DemoSection>
      </div>
    </div>
  );
}
