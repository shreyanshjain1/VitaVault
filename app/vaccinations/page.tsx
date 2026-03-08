import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveVaccination } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function VaccinationsPage() {
  const user = await requireUser();
  const records = await db.vaccinationRecord.findMany({ where: { userId: user.id }, orderBy: { dateTaken: "desc" } });
  return <AppShell><PageHeader title="Vaccination History" description="Track vaccine doses, clinics, and upcoming due dates." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Add vaccination</CardTitle></CardHeader><CardContent><form action={saveVaccination} className="grid gap-4"><div className="space-y-2"><Label>Vaccine name</Label><Input name="vaccineName" required /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Dose number</Label><Input type="number" name="doseNumber" required /></div><div className="space-y-2"><Label>Date taken</Label><Input type="date" name="dateTaken" required /></div></div><div className="space-y-2"><Label>Clinic / location</Label><Input name="location" /></div><div className="space-y-2"><Label>Next due date</Label><Input type="date" name="nextDueDate" /></div><div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div><Button>Add vaccination</Button></form></CardContent></Card><div className="space-y-4">{records.length ? records.map(r => <Card key={r.id}><CardContent className="pt-6"><h3 className="text-lg font-semibold">{r.vaccineName}</h3><p className="text-sm text-muted-foreground">Dose {r.doseNumber} • {r.location ?? "No location"}</p><div className="mt-3 grid gap-2 text-sm"><p>Date taken: {formatDate(r.dateTaken)}</p><p>Next due: {formatDate(r.nextDueDate)}</p><p>Notes: {r.notes ?? "—"}</p></div></CardContent></Card>) : <EmptyState title="No vaccination records" description="Store vaccines and next due dates for long-term health tracking." />}</div></div></AppShell>;
}
