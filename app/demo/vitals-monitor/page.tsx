import { DemoHeader, DemoSection, ProgressBar, SimpleTable, ToneBadge } from "@/components/demo-primitives";
import { demoVitalsMonitorHub } from "@/lib/demo-data";

export default function DemoVitalsMonitorPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Clinical review" title="Vitals Monitor demo" description="Latest and previous vital readings, deltas, watch zones, averages, recent timeline, and connected-device signals." />
      <DemoSection title="Vitals readiness"><ProgressBar value={demoVitalsMonitorHub.readiness} label="Vitals monitor readiness" /></DemoSection>
      <DemoSection title="Metric cards"><SimpleTable headers={["Metric", "Latest", "Previous", "Delta", "Status"]} rows={demoVitalsMonitorHub.metrics.map((item) => [item.metric, item.latest, item.previous, item.delta, <ToneBadge key={item.metric} value={item.status} />])} /></DemoSection>
      <DemoSection title="Device signals"><SimpleTable headers={["Provider", "Status", "Last sync"]} rows={demoVitalsMonitorHub.deviceSignals.map((item) => [item.provider, <ToneBadge key={item.provider} value={item.status} />, item.lastSync])} /></DemoSection>
    </div>
  );
}
