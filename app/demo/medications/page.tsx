import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoMedications } from "@/lib/demo-data";

export default function DemoMedicationsPage() {
  const headers = ["Medication", "Dosage", "Frequency", "Times", "Status", "Doctor", "Adherence", "Instructions"];
  const rows = demoMedications.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [
      item.name,
      item.dosage,
      item.frequency,
      item.times.join(", "),
      item.status,
      item.doctor,
      item.adherence,
      item.instructions,
    ],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Medications"
        description="Give visitors a clear look at schedules, adherence, and patient instructions without needing to sign in."
      />
      <DemoSection title="Active medication plan" description="This sample mirrors the structure of the real medication workspace in a read-only format.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
