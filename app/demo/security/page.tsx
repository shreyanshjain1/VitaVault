import { DemoHeader, DemoSection, KeyValueList, SimpleTable } from "@/components/demo-primitives";
import { demoSecurity } from "@/lib/demo-data";

export default function DemoSecurityPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Security Center" description="Account posture, mobile session visibility, and controlled access surfaces." />
      <DemoSection title="Security posture">
        <KeyValueList items={demoSecurity.posture} />
      </DemoSection>
      <DemoSection title="Session inventory">
        <SimpleTable headers={["Device", "Created", "Last used", "Expires", "State"]} rows={demoSecurity.sessions.map((item) => [item.device, item.createdAt, item.lastUsed, item.expires, item.state])} />
      </DemoSection>
    </div>
  );
}
