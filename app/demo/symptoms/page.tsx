import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoSymptoms } from "@/lib/demo-data";

export default function DemoSymptomsPage() {
  const headers = ["Symptom", "Severity", "Status", "Logged", "Notes"];
  const rows = demoSymptoms.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [item.name, item.severity, item.status, item.loggedAt, item.note],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Symptoms"
        description="A simple symptom log that still makes it clear how entries can support alerts, review, and caregiver follow-up."
      />
      <DemoSection title="Logged symptoms" description="Each entry shows severity, status, and enough context to understand the next step.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
