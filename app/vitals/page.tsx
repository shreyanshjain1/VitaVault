import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveVital } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TBody, TD, TH, THead, TR, Textarea } from "@/components/ui";
import { bpLabel, formatDateTime } from "@/lib/utils";

export default async function VitalsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const vitals = await db.vitalRecord.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "desc" } });
  const filtered = vitals.filter(v => JSON.stringify(v).toLowerCase().includes(q.toLowerCase()));
  return <AppShell><PageHeader title="Vital Signs Tracker" description="Record vitals, see history, and use charts from the dashboard for trends." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Log vitals</CardTitle></CardHeader><CardContent><form action={saveVital} className="grid gap-4"><div className="space-y-2"><Label>Date & time</Label><Input type="datetime-local" name="recordedAt" required /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Systolic</Label><Input type="number" name="systolic" /></div><div className="space-y-2"><Label>Diastolic</Label><Input type="number" name="diastolic" /></div><div className="space-y-2"><Label>Heart rate</Label><Input type="number" name="heartRate" /></div><div className="space-y-2"><Label>Blood sugar</Label><Input type="number" step="0.1" name="bloodSugar" /></div><div className="space-y-2"><Label>Oxygen saturation</Label><Input type="number" name="oxygenSaturation" /></div><div className="space-y-2"><Label>Temperature (°C)</Label><Input type="number" step="0.1" name="temperatureC" /></div><div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.1" name="weightKg" /></div></div><div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div><Button>Add vital record</Button></form></CardContent></Card><div className="space-y-4"><Card><CardContent className="pt-6"><form className="grid gap-3 md:grid-cols-[1fr_auto]"><Input name="q" placeholder="Search vitals" defaultValue={q} /><Button>Search</Button></form></CardContent></Card>{filtered.length ? <Card><CardContent className="pt-6"><div className="overflow-x-auto"><Table><THead><TR><TH>Date</TH><TH>BP</TH><TH>HR</TH><TH>Sugar</TH><TH>O2</TH><TH>Temp</TH><TH>Weight</TH></TR></THead><TBody>{filtered.map(item => <TR key={item.id}><TD>{formatDateTime(item.recordedAt)}</TD><TD>{bpLabel(item.systolic, item.diastolic)}</TD><TD>{item.heartRate ?? "—"}</TD><TD>{item.bloodSugar ?? "—"}</TD><TD>{item.oxygenSaturation ?? "—"}</TD><TD>{item.temperatureC ?? "—"}</TD><TD>{item.weightKg ?? "—"}</TD></TR>)}</TBody></Table></div></CardContent></Card> : <EmptyState title="No vital records" description="Add your first blood pressure or weight entry to start building trends." />}</div></div></AppShell>;
}
