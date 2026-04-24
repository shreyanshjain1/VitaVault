import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoSummary } from "@/lib/demo-data";

export default function DemoSummaryPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Patient Summary" description="Printable summary view and handoff snapshot for patient care conversations." />
      <DemoSection title="Snapshot narrative">
        <p className="text-sm leading-7 text-muted-foreground">{demoSummary.snapshot}</p>
      </DemoSection>
      <DemoSection title="Key highlights">
        <SimpleTable headers={["Highlight"]} rows={demoSummary.highlights.map((item) => [item])} />
      </DemoSection>
    </div>
  );
}
