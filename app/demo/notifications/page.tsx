import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards, ToneBadge } from "@/components/demo-primitives";
import { demoNotifications } from "@/lib/demo-data";

export default function DemoNotificationsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Care workflow" title="Notification Center demo" description="A read-only preview of VitaVault's unified care inbox for alerts, reminders, appointments, documents, care invites, and device issues." />
      <MetricGrid items={demoNotifications.metrics} />
      <DemoSection title="Prioritized inbox" description="The authenticated app turns these signals into source-linked action cards with priority filters.">
        <SimpleTable headers={["Source", "Priority", "Notification", "Context"]} rows={demoNotifications.inbox.map((item) => [item.source, <ToneBadge key={`${item.title}-priority`} value={item.priority} />, item.title, item.detail])} />
      </DemoSection>
      <DemoSection title="Recommended next actions">
        <StatCards items={demoNotifications.inbox.slice(0, 3).map((item) => ({ title: item.title, body: item.detail, status: item.priority }))} />
      </DemoSection>
    </div>
  );
}
