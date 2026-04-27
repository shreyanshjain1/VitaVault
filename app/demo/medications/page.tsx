import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoMedications } from "@/lib/demo-data";

export default function DemoMedicationsPage() {
  const headers = ["Medication", "Dosage", "Frequency", "Times", "Status", "Doctor", "Adherence", "Instructions"];
  const rows = demoMedications.map((item) => [
    item.name,
    item.dosage,
    item.frequency,
    item.times.join(", "),
    item.status,
    item.doctor,
    item.adherence,
    item.instructions,
  ]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Medications" description="Schedules, adherence signals, linked doctors, and patient-facing instructions." />
      <DemoSection title="Active medication plan">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
