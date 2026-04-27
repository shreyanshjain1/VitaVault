import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoDocuments } from "@/lib/demo-data";

export default function DemoDocumentsPage() {
  const headers = ["Document", "Type", "Linked to", "Access", "Size"];
  const rows = demoDocuments.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [item.name, item.type, item.linkedTo, item.access, item.size],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Documents"
        description="Show how reports, scans, and uploaded files can stay organized while still feeling easy to browse."
      />
      <DemoSection title="Document library" description="Each file can be linked back to the part of the record where it matters most.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
