import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoDoctors } from "@/lib/demo-data";

export default function DemoDoctorsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Care network" title="Doctors" description="Shows the provider directory users manage in VitaVault, including specialties, clinic linkage, and communication context." />
      <MetricGrid items={[
        { label: "Tracked providers", value: String(demoDoctors.length), note: "Primary and specialty care" },
        { label: "Specialties", value: "3", note: "Endocrinology, internal medicine, ophthalmology" },
        { label: "Linked appointments", value: "3", note: "All major upcoming visits connected" },
        { label: "Direct contacts", value: "100%", note: "Phone and email stored" },
      ]} />
      <DemoSection title="Provider table">
        <SimpleTable headers={["Doctor", "Specialty", "Clinic", "Phone", "Email"]} rows={demoDoctors.map((item) => [item.name, item.specialty, item.clinic, item.phone, item.email])} />
      </DemoSection>
      <DemoSection title="How this connects elsewhere">
        <StatCards items={demoDoctors.map((item) => ({ title: item.name, body: `${item.specialty} at ${item.clinic}. Referenced across appointments, documents, and summary exports.`, status: "Active" }))} />
      </DemoSection>
    </div>
  );
}
