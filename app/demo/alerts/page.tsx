import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoAlerts } from "@/lib/demo-data";

export default function DemoAlertsPage() {
  const eventHeaders = ["Title", "Severity", "Status", "Category", "Source", "Created"];
  const eventRows = demoAlerts.events.map((item) => [
    item.title,
    item.severity,
    item.status,
    item.category,
    item.source,
    item.createdAt,
  ]);
  const ruleHeaders = ["Rule", "Category", "Severity", "Status"];
  const ruleRows = demoAlerts.rules.map((item) => [item.name, item.category, item.severity, item.status]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Alert Center" description="Threshold rules, event statuses, categories, and review context." />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Alert events">
          <SimpleTable headers={eventHeaders} rows={eventRows} />
        </DemoSection>
        <DemoSection title="Alert rules">
          <SimpleTable headers={ruleHeaders} rows={ruleRows} />
        </DemoSection>
      </div>
    </div>
  );
}
