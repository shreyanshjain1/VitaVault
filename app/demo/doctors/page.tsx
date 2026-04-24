import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoDoctors } from "@/lib/demo-data";

export default function DemoDoctorsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Doctors" description="Specialists, clinic details, and contact information linked to care workflows." />
      <DemoSection title="Provider directory">
        <SimpleTable headers={["Doctor", "Specialty", "Clinic", "Phone", "Email"]} rows={demoDoctors.map((item) => [item.name, item.specialty, item.clinic, item.phone, item.email])} />
      </DemoSection>
    </div>
  );
}
