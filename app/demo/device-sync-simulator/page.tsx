import { DemoHeader, DemoSection, SimpleTable, ToneBadge } from "@/components/demo-primitives";
import { demoDeviceSyncSimulatorHub } from "@/lib/demo-data";

export default function DemoDeviceSyncSimulatorPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Platform demo" title="Device Sync Simulator demo" description="A read-only mirror of the authenticated simulator that creates device connections, readings, sync jobs, job logs, and mirrored vitals." />
      <DemoSection title="Supported simulated providers"><SimpleTable headers={["Provider", "Readings", "Status"]} rows={demoDeviceSyncSimulatorHub.providers.map((item) => [item.provider, item.readings, <ToneBadge key={item.provider} value={item.status} />])} /></DemoSection>
      <DemoSection title="Recent simulated syncs"><SimpleTable headers={["Job", "Status", "Result"]} rows={demoDeviceSyncSimulatorHub.recentSyncs.map((item) => [item.job, <ToneBadge key={item.job} value={item.status} />, item.result])} /></DemoSection>
    </div>
  );
}
