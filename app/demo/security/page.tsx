import { DemoHeader, DemoSection, KeyValueList, SimpleTable } from "@/components/demo-primitives";
import { demoSecurity } from "@/lib/demo-data";

export default function DemoSecurityPage() {
  const sessionHeaders = ["Device", "Created", "Last used", "Expires", "State"];
  const sessionRows = demoSecurity.sessions.map((item, index) => ({
    key: `${item.device}-${index}`,
    cells: [item.device, item.createdAt, item.lastUsed, item.expires, item.state],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Security Center"
        description="Show account posture, mobile session visibility, and recovery surfaces in a way that feels calm and trustworthy."
      />
      <DemoSection title="Security posture" description="A simple summary of the account controls that matter most.">
        <KeyValueList items={demoSecurity.posture} />
      </DemoSection>
      <DemoSection title="Session inventory" description="A sample list of mobile and device sessions that would normally be revocable by the account owner.">
        <SimpleTable headers={sessionHeaders} rows={sessionRows} />
      </DemoSection>
    </div>
  );
}
