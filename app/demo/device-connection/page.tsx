import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoDevices } from "@/lib/demo-data";

export default function DemoDeviceConnectionPage() {
  const headers = ["Provider", "Status", "Last sync", "Readings", "Notes"];
  const rows = demoDevices.map((item) => [item.provider, item.status, item.lastSync, item.readings, item.note ?? "—"]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Device Integration v2" description="Connected apps and health devices now have a real authenticated dashboard with lifecycle actions, per-device detail views, sync jobs, raw readings, and mirrored vitals." />
      <DemoSection title="Connection status"><SimpleTable headers={headers} rows={rows} /></DemoSection>
      <DemoSection title="What authenticated reviewers can inspect">
        <SimpleTable headers={["Surface", "Purpose", "Portfolio value"]} rows={[
          ["/device-connection", "Connection management, QA payloads, supported reading contract, recent readings, and sync jobs", "Shows real product operations instead of roadmap-only cards"],
          ["/device-connection/[id]", "Connection-specific readings, metadata, sync jobs, job runs, mirrored vitals, and actions", "Proves traceability from device payload to patient vitals"],
          ["/device-sync-simulator", "Creates demo connections, readings, sync jobs, job runs, and mirrored vitals", "Lets reviewers see the integration flow without vendor credentials"],
        ]} />
      </DemoSection>
    </div>
  );
}
