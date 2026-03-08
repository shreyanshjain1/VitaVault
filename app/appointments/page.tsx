import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveAppointment } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function AppointmentsPage() {
  const user = await requireUser();
  const [appointments, doctors] = await Promise.all([
    db.appointment.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: "asc" } }),
    db.doctor.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } })
  ]);
  return <AppShell><PageHeader title="Appointments" description="Plan visits, notes, clinic details, and follow-ups." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Add appointment</CardTitle></CardHeader><CardContent><form action={saveAppointment} className="grid gap-4"><div className="space-y-2"><Label>Clinic / hospital</Label><Input name="clinic" required /></div><div className="space-y-2"><Label>Specialty</Label><Input name="specialty" /></div><div className="space-y-2"><Label>Doctor name</Label><Input name="doctorName" required /></div><div className="space-y-2"><Label>Linked doctor</Label><Select name="doctorId" defaultValue=""><option value="">Select doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div><div className="space-y-2"><Label>Date & time</Label><Input type="datetime-local" name="scheduledAt" required /></div><div className="space-y-2"><Label>Purpose</Label><Input name="purpose" required /></div><div className="space-y-2"><Label>Status</Label><Select name="status" defaultValue="UPCOMING"><option value="UPCOMING">Upcoming</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></Select></div><div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div><div className="space-y-2"><Label>Follow-up notes</Label><Textarea name="followUpNotes" /></div><Button>Add appointment</Button></form></CardContent></Card><div className="space-y-4">{appointments.length ? appointments.map(a => <Card key={a.id}><CardContent className="pt-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{a.purpose}</h3><p className="text-sm text-muted-foreground">{a.doctorName} • {a.clinic}</p></div><Badge>{a.status}</Badge></div><p className="mt-3 text-sm">Specialty: {a.specialty ?? "—"}</p><p className="text-sm">When: {formatDateTime(a.scheduledAt)}</p><p className="mt-3 text-sm text-muted-foreground">Notes: {a.notes ?? "—"}</p><p className="text-sm text-muted-foreground">Follow-up: {a.followUpNotes ?? "—"}</p></CardContent></Card>) : <EmptyState title="No appointments yet" description="Add upcoming consultations and store follow-up notes after each visit." />}</div></div></AppShell>;
}
