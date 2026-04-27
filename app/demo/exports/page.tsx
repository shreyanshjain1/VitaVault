import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoExports } from "@/lib/demo-data";

export default function DemoExportsPage() {
  const headers = ["Export", "Format", "Status", "Notes"];
  const rows = demoExports.map((item) => [item.name, item.format, item.status, item.note]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Exports" description="Business-friendly export formats for summaries, records, and operational review." />
      <DemoSection title="Available exports">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
