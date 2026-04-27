import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoExports } from "@/lib/demo-data";

export default function DemoExportsPage() {
  const headers = ["Export", "Format", "Status", "Notes"];
  const rows = demoExports.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [item.name, item.format, item.status, item.note],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Exports"
        description="Preview the kinds of record and reporting exports that make VitaVault easier to share and review outside the app."
      />
      <DemoSection title="Available exports" description="A sample of patient-facing and admin-facing export flows.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
