import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoAlerts } from "@/lib/demo-data";

export default function DemoAlertsPage() {
  const eventHeaders = ["Title", "Severity", "Status", "Category", "Source", "Created"];
  const eventRows = demoAlerts.events.map((item, index) => ({
    key: `${item.title}-${index}`,
    cells: [item.title, item.severity, item.status, item.category, item.source, item.createdAt],
  }));
  const ruleHeaders = ["Rule", "Category", "Severity", "Status"];
  const ruleRows = demoAlerts.rules.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [item.name, item.category, item.severity, item.status],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Alert Center"
        description="Review active events, see what triggered them, and understand how rules support follow-up across the record."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Alert events" description="Events surfaced from symptoms, labs, reminders, and monitoring logic.">
          <SimpleTable headers={eventHeaders} rows={eventRows} />
        </DemoSection>
        <DemoSection title="Rule library" description="Sample threshold rules that shape the alerting flow.">
          <SimpleTable headers={ruleHeaders} rows={ruleRows} />
        </DemoSection>
      </div>
    </div>
  );
}
