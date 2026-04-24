import { DemoHeader, DemoSection, MetricGrid, SimpleTable } from "@/components/demo-primitives";
import { demoOps } from "@/lib/demo-data";

export default function DemoOpsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Operations" description="Readiness checks and high-level operational monitoring for delivery and sync workflows." />
      <MetricGrid items={demoOps.metrics} />
      <DemoSection title="Environment readiness">
        <SimpleTable headers={["Check", "Status"]} rows={demoOps.readiness.map((item) => [item.label, item.status])} />
      </DemoSection>
    </div>
  );
}
