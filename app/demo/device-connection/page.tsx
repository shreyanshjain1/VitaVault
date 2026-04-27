import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoDevices } from "@/lib/demo-data";

export default function DemoDeviceConnectionPage() {
  const headers = ["Provider", "Status", "Last sync", "Readings", "Notes"];
  const rows = demoDevices.map((item, index) => ({
    key: `${item.provider}-${index}`,
    cells: [item.provider, item.status, item.lastSync, item.readings, item.note ?? "—"],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Device Connections"
        description="Preview how connected apps and wearables feed data into VitaVault without making the page feel overly technical."
      />
      <DemoSection title="Connection status" description="A quick view of sync health, reading coverage, and where attention might be needed.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
