import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoCareTeam } from "@/lib/demo-data";

export default function DemoCareTeamPage() {
  const memberRows = demoCareTeam.members.map((item) => [item.name, item.role, item.access, item.status]);
  const inviteRows = demoCareTeam.invites.map((item) => [item.recipient, item.role, item.sentAt, item.delivery, item.status]);

  return (
    <div className="space-y-6">
      <DemoHeader title="Care Team" description="Shared access, pending invites, and role-based collaboration across patient care." />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Active members">
          <SimpleTable headers={["Name", "Role", "Access", "Status"]} rows={memberRows} />
        </DemoSection>
        <DemoSection title="Pending invites">
          <SimpleTable headers={["Recipient", "Role", "Sent", "Delivery", "Status"]} rows={inviteRows} />
        </DemoSection>
      </div>
    </div>
  );
}
