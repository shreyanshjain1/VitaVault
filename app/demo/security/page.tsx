import { DemoHeader, DemoSection, KeyValueList, SimpleTable } from "@/components/demo-primitives";
import { demoSecurity } from "@/lib/demo-data";

export default function DemoSecurityPage() {
  const sessionHeaders = ["Device", "Created", "Last used", "Expires", "State"];
  const sessionRows = demoSecurity.sessions.map((item) => ({ key: `${item.device}-${item.createdAt}`, cells: [item.device, item.createdAt, item.lastUsed, item.expires, item.state] }));
  return (
    <div className="space-y-6">
      <DemoHeader title="Security Center" description="Account posture, mobile session visibility, and controlled access surfaces." />
      <DemoSection title="Security posture">
        <KeyValueList items={demoSecurity.posture} />
      </DemoSection>
      <DemoSection title="Session inventory">
        <SimpleTable headers={sessionHeaders} rows={sessionRows} />
      </DemoSection>
    </div>
  );
}
