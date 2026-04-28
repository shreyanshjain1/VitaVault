import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoAppointments } from "@/lib/demo-data";

export default function DemoAppointmentsPage() {
  const headers = ["Visit", "When", "Location", "Status", "Doctor", "Notes"];
  const rows = demoAppointments.map((item) => ({ key: `${item.title}-${item.when}`, cells: [item.title, item.when, item.location, item.status, item.doctor, item.note] }));
  return (
    <div className="space-y-6">
      <DemoHeader title="Appointments" description="Upcoming and completed visits with clinic context, status, and follow-up notes." />
      <DemoSection title="Appointment timeline">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
