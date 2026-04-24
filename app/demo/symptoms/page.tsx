import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoSymptoms } from "@/lib/demo-data";

export default function DemoSymptomsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Symptoms" description="Symptom tracking feeds alerts, review queues, and care-team follow-up." />
      <DemoSection title="Logged symptoms">
        <SimpleTable headers={["Symptom", "Severity", "Status", "Logged", "Notes"]} rows={demoSymptoms.map((item) => [item.name, item.severity, item.status, item.loggedAt, item.note])} />
      </DemoSection>
    </div>
  );
}
