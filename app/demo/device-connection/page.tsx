import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoDevices } from "@/lib/demo-data";

export default function DemoDeviceConnectionPage() {
  const rows = demoDevices.map((item) => [item.provider, item.status, item.lastSync, item.readings, item.note ?? "—"]);

  return (
    <div className="space-y-6">
      <DemoHeader title="Device Connections" description="Connected apps and devices that feed VitaVault vitals and sync workflows." />
      <DemoSection title="Connection status">
        <SimpleTable headers={["Provider", "Status", "Last sync", "Readings", "Notes"]} rows={rows} />
      </DemoSection>
    </div>
  );
}
