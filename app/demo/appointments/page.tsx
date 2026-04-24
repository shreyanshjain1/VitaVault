import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoAppointments } from "@/lib/demo-data";

export default function DemoAppointmentsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Appointments" description="Upcoming and completed visits with clinic context, status, and follow-up notes." />
      <DemoSection title="Appointment timeline">
        <SimpleTable headers={["Visit", "When", "Location", "Status", "Doctor", "Notes"]} rows={demoAppointments.map((item) => [item.title, item.when, item.location, item.status, item.doctor, item.note])} />
      </DemoSection>
    </div>
  );
}
