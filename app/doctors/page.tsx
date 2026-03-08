import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { addDoctor } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";

export default async function DoctorsPage() {
  const user = await requireUser();
  const doctors = await db.doctor.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <AppShell><PageHeader title="Doctors & Clinics" description="Manage doctors, specialties, clinic details, and notes." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Add doctor</CardTitle></CardHeader><CardContent><form action={addDoctor} className="grid gap-4"><div className="space-y-2"><Label>Name</Label><Input name="name" required /></div><div className="space-y-2"><Label>Specialty</Label><Input name="specialty" /></div><div className="space-y-2"><Label>Clinic</Label><Input name="clinic" /></div><div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div><div className="space-y-2"><Label>Email</Label><Input type="email" name="email" /></div><div className="space-y-2"><Label>Address</Label><Input name="address" /></div><div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div><Button>Add doctor</Button></form></CardContent></Card><div className="space-y-4">{doctors.length ? doctors.map(doctor => <Card key={doctor.id}><CardContent className="pt-6"><h3 className="text-lg font-semibold">{doctor.name}</h3><p className="text-sm text-muted-foreground">{doctor.specialty ?? "General"} • {doctor.clinic ?? "No clinic set"}</p><div className="mt-3 grid gap-2 text-sm"><p>Phone: {doctor.phone ?? "—"}</p><p>Email: {doctor.email ?? "—"}</p><p>Address: {doctor.address ?? "—"}</p><p>Notes: {doctor.notes ?? "—"}</p></div></CardContent></Card>) : <EmptyState title="No doctors yet" description="Add your doctors and clinics so appointments and medications can reference them." />}</div></div></AppShell>;
}
