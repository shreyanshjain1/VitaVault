import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoLabs } from "@/lib/demo-data";

export default function DemoLabsPage() {
  const headers = ["Test", "Value", "Trend", "Status", "Collected", "Lab"];
  const rows = demoLabs.map((item, index) => ({
    key: `${item.test}-${index}`,
    cells: [item.test, item.value, item.trend, item.status, item.collectedAt, item.lab],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Labs"
        description="A more approachable lab view that still shows trends, status, and collection context clearly."
      />
      <DemoSection title="Latest lab set" description="Good for explaining how trends and exception handling might appear in the live app.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
