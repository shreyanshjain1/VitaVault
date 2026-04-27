import { DemoHeader, DemoSection, MetricGrid, SimpleTable } from "@/components/demo-primitives";
import { demoOps } from "@/lib/demo-data";

export default function DemoOpsPage() {
  const readinessHeaders = ["Check", "Status"];
  const readinessRows = demoOps.readiness.map((item) => ({
    key: item.label,
    cells: [item.label, item.status],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Operations"
        description="A cleaner operations view that highlights readiness and workflow health without feeling like an internal debug screen."
      />
      <MetricGrid items={demoOps.metrics} />
      <DemoSection title="Environment readiness" description="Helpful for showing how the app surfaces checks and delivery dependencies to operators.">
        <SimpleTable headers={readinessHeaders} rows={readinessRows} />
      </DemoSection>
    </div>
  );
}
