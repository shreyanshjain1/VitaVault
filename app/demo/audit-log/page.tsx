import { DemoHeader, DemoSection, SimpleTable, ToneBadge } from "@/components/demo-primitives";
import { demoAuditLogHub } from "@/lib/demo-data";

export default function DemoAuditLogPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Security/Ops" title="Audit Log demo" description="A unified audit trail preview across access changes, alert workflows, reminders, sessions, jobs, and admin actions." />
      <DemoSection title="Merged audit feed"><SimpleTable headers={["Source", "Action", "Actor", "Target", "When"]} rows={demoAuditLogHub.map((item) => [<ToneBadge key={item.at} value={item.source} />, item.action, item.actor, item.target, item.at])} /></DemoSection>
    </div>
  );
}
