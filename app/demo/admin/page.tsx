import { DemoHeader, DemoSection, MetricGrid, SimpleTable } from "@/components/demo-primitives";
import { demoAdmin } from "@/lib/demo-data";

export default function DemoAdminPage() {
  const rosterHeaders = ["User", "Role", "Status", "Sessions", "Alerts", "Documents"];
  const rosterRows = demoAdmin.roster.map((item) => [
    item.name,
    item.role,
    item.status,
    String(item.sessions),
    String(item.alerts),
    String(item.documents),
  ]);
  const auditHeaders = ["Source", "Message", "When"];
  const auditRows = demoAdmin.audit.map((item) => [item.source, item.message, item.at]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Admin Workspace" description="User oversight, moderation actions, audit visibility, and platform-level review." />
      <MetricGrid items={demoAdmin.metrics} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DemoSection title="User roster">
          <SimpleTable headers={rosterHeaders} rows={rosterRows} />
        </DemoSection>
        <DemoSection title="Audit feed">
          <SimpleTable headers={auditHeaders} rows={auditRows} />
        </DemoSection>
      </div>
    </div>
  );
}
