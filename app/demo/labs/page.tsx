import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoLabs } from "@/lib/demo-data";

export default function DemoLabsPage() {
  const rows = demoLabs.map((item) => [item.test, item.value, item.trend, item.status, item.collectedAt, item.lab]);

  return (
    <div className="space-y-6">
      <DemoHeader title="Labs" description="Lab trends, status indicators, and uploaded result context." />
      <DemoSection title="Latest lab set">
        <SimpleTable headers={["Test", "Value", "Trend", "Status", "Collected", "Lab"]} rows={rows} />
      </DemoSection>
    </div>
  );
}
