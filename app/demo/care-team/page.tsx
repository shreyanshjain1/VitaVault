import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoCareTeam } from "@/lib/demo-data";

export default function DemoCareTeamPage() {
  const memberHeaders = ["Name", "Role", "Access", "Status"];
  const memberRows = demoCareTeam.members.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [item.name, item.role, item.access, item.status],
  }));
  const inviteHeaders = ["Recipient", "Role", "Sent", "Delivery", "Status"];
  const inviteRows = demoCareTeam.invites.map((item, index) => ({
    key: `${item.recipient}-${index}`,
    cells: [item.recipient, item.role, item.sentAt, item.delivery, item.status],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Care Team"
        description="Show how family members and clinicians can be invited into the record with the right level of access."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Active members" description="People who currently have access to the patient workspace.">
          <SimpleTable headers={memberHeaders} rows={memberRows} />
        </DemoSection>
        <DemoSection title="Pending invites" description="Invite status, delivery state, and role selection in one glance.">
          <SimpleTable headers={inviteHeaders} rows={inviteRows} />
        </DemoSection>
      </div>
    </div>
  );
}
