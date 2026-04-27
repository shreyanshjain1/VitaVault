import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoVaccinations } from "@/lib/demo-data";

export default function DemoVaccinationsPage() {
  const headers = ["Vaccine", "Date", "Provider", "Status"];
  const rows = demoVaccinations.map((item, index) => ({
    key: `${item.name}-${index}`,
    cells: [item.name, item.date, item.provider, item.status],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Vaccinations"
        description="A cleaner preventive-care view that helps the record feel useful even in a quick public walkthrough."
      />
      <DemoSection title="Vaccination records" description="Shows a sample immunization history and the kind of status visibility the product can provide.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
