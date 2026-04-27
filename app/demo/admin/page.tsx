import { DemoHeader, DemoSection, MetricGrid, SimpleTable } from "@/components/demo-primitives";
import { demoAdmin } from "@/lib/demo-data";

export default function DemoAdminPage() {
  const rosterHeaders = ["User", "Role", "Status", "Sessions", "Alerts", "Documents"];
  const rosterRows = demoAdmin.roster.map((item) => ({
    key: item.name,
    cells: [
      item.name,
      item.role,
      item.status,
      String(item.sessions),
      String(item.alerts),
      String(item.documents),
    ],
  }));
  const auditHeaders = ["Source", "Message", "When"];
  const auditRows = demoAdmin.audit.map((item, index) => ({ key: `${item.source}-${index}`, cells: [item.source, item.message, item.at] }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Admin Workspace"
        description="See how admins can review accounts, watch platform activity, and keep an eye on operational health from one place."
      />
      <MetricGrid items={demoAdmin.metrics} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DemoSection title="User roster" description="A quick read on account status, access footprint, and review signals.">
          <SimpleTable headers={rosterHeaders} rows={rosterRows} />
        </DemoSection>
        <DemoSection title="Recent admin activity" description="A small sample of audit events that help explain what changed and when.">
          <SimpleTable headers={auditHeaders} rows={auditRows} />
        </DemoSection>
      </div>
    </div>
  );
}
