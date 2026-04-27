import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoDocuments } from "@/lib/demo-data";

export default function DemoDocumentsPage() {
  const rows = demoDocuments.map((item) => [item.name, item.type, item.linkedTo, item.access, item.size]);

  return (
    <div className="space-y-6">
      <DemoHeader title="Documents" description="Protected document delivery, record linking, and clinically useful file organization." />
      <DemoSection title="Document library">
        <SimpleTable headers={["Document", "Type", "Linked to", "Access", "Size"]} rows={rows} />
      </DemoSection>
    </div>
  );
}
