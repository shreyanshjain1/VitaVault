import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoVaccinations } from "@/lib/demo-data";

export default function DemoVaccinationsPage() {
  const headers = ["Vaccine", "Date", "Provider", "Status"];
  const rows = demoVaccinations.map((item) => [item.name, item.date, item.provider, item.status]);
  return (
    <div className="space-y-6">
      <DemoHeader title="Vaccinations" description="Immunization history and preventive gaps in one place." />
      <DemoSection title="Vaccination records">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
