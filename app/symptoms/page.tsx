import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveSymptom } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function SymptomsPage({ searchParams }: { searchParams: Promise<{ q?: string; resolved?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const resolved = params.resolved ?? "";
  const symptoms = await db.symptomEntry.findMany({
    where: {
      userId: user.id,
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }, { bodyArea: { contains: q, mode: "insensitive" } }] } : {}),
      ...(resolved === "true" ? { resolved: true } : {}),
      ...(resolved === "false" ? { resolved: false } : {})
    },
    orderBy: { startedAt: "desc" }
  });
  return <AppShell><PageHeader title="Symptom Journal" description="Capture severity, body area, triggers, and resolution status with searchable history." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Add symptom entry</CardTitle></CardHeader><CardContent><form action={saveSymptom} className="grid gap-4"><div className="space-y-2"><Label>Symptom title</Label><Input name="title" required /></div><div className="space-y-2"><Label>Severity</Label><Select name="severity" defaultValue="MILD"><option value="MILD">Mild</option><option value="MODERATE">Moderate</option><option value="SEVERE">Severe</option></Select></div><div className="space-y-2"><Label>Body area</Label><Input name="bodyArea" /></div><div className="space-y-2"><Label>Date & time</Label><Input type="datetime-local" name="startedAt" required /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Duration</Label><Input name="duration" /></div><div className="space-y-2"><Label>Trigger</Label><Input name="trigger" /></div></div><div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="resolved" /> Mark as resolved</label><Button>Add symptom</Button></form></CardContent></Card><div className="space-y-4"><Card><CardContent className="pt-6"><form className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input name="q" placeholder="Search symptoms" defaultValue={q} /><Select name="resolved" defaultValue={resolved}><option value="">All statuses</option><option value="false">Unresolved</option><option value="true">Resolved</option></Select><Button>Filter</Button></form></CardContent></Card>{symptoms.length ? symptoms.map(s => <Card key={s.id}><CardContent className="pt-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{s.title}</h3><p className="text-sm text-muted-foreground">{s.bodyArea ?? "General"} • {s.duration ?? "No duration"}</p></div><Badge>{s.severity}</Badge></div><p className="mt-3 text-sm">Trigger: {s.trigger ?? "—"}</p><p className="text-sm text-muted-foreground">{s.notes ?? "No notes provided."}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(s.startedAt)} • {s.resolved ? "Resolved" : "Unresolved"}</p></CardContent></Card>) : <EmptyState title="No symptom entries" description="Log symptoms to spot patterns and bring better details to your doctor." />}</div></div></AppShell>;
}
