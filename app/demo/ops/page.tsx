import { DemoHeader, DemoSection, MetricGrid, SimpleTable } from "@/components/demo-primitives";
import { demoOps } from "@/lib/demo-data";

export default function DemoOpsPage() {
  const readinessHeaders = ["Check", "Status"];
  const readinessRows = demoOps.readiness.map((item) => [item.label, item.status]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Operations" description="Readiness checks and high-level operational monitoring for delivery and sync workflows." />
      <MetricGrid items={demoOps.metrics} />
      <DemoSection title="Environment readiness">
        <SimpleTable headers={readinessHeaders} rows={readinessRows} />
      </DemoSection>
    </div>
  );
}
