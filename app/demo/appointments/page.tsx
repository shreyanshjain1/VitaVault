import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoAppointments } from "@/lib/demo-data";

export default function DemoAppointmentsPage() {
  const headers = ["Visit", "When", "Location", "Status", "Doctor", "Notes"];
  const rows = demoAppointments.map((item, index) => ({
    key: `${item.title}-${index}`,
    cells: [item.title, item.when, item.location, item.status, item.doctor, item.note],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Appointments"
        description="A simple view of upcoming visits, completed check-ins, and the notes that help keep care organized."
      />
      <DemoSection title="Appointment timeline" description="Each entry shows the clinic, provider, and follow-up context tied to the visit.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
