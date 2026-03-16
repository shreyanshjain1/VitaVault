import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveLabResult } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function LabsPage({ searchParams }: { searchParams: Promise<{ q?: string; flag?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const flag = params.flag ?? "";
  const results = await db.labResult.findMany({
    where: {
      userId: user.id,
      ...(q ? { OR: [{ testName: { contains: q, mode: "insensitive" } }, { resultSummary: { contains: q, mode: "insensitive" } }] } : {}),
      ...(flag ? { flag: flag as any } : {})
    },
    orderBy: { dateTaken: "desc" }
  });
  return <AppShell><PageHeader title="Lab Results" description="Log tests, upload supporting files, and highlight abnormal results." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Add lab result</CardTitle></CardHeader><CardContent><form action={saveLabResult} className="grid gap-4"><div className="space-y-2"><Label>Lab test name</Label><Input name="testName" required /></div><div className="space-y-2"><Label>Date taken</Label><Input type="date" name="dateTaken" required /></div><div className="space-y-2"><Label>Result summary</Label><Textarea name="resultSummary" required /></div><div className="space-y-2"><Label>Reference range</Label><Input name="referenceRange" /></div><div className="space-y-2"><Label>Status flag</Label><Select name="flag" defaultValue="NORMAL"><option value="NORMAL">Normal</option><option value="BORDERLINE">Borderline</option><option value="HIGH">High</option><option value="LOW">Low</option></Select></div><div className="space-y-2"><Label>Supporting file</Label><Input type="file" name="file" accept=".pdf,image/png,image/jpeg,image/webp" /></div><Button>Add lab result</Button></form></CardContent></Card><div className="space-y-4"><Card><CardContent className="pt-6"><form className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input name="q" placeholder="Search test or result summary" defaultValue={q} /><Select name="flag" defaultValue={flag}><option value="">All flags</option><option value="NORMAL">Normal</option><option value="BORDERLINE">Borderline</option><option value="HIGH">High</option><option value="LOW">Low</option></Select><Button>Filter</Button></form></CardContent></Card>{results.length ? results.map(r => <Card key={r.id}><CardContent className="pt-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{r.testName}</h3><p className="text-sm text-muted-foreground">{r.resultSummary}</p></div><Badge className={r.flag === "NORMAL" ? "" : "border-destructive/30 bg-destructive/5 text-destructive"}>{r.flag}</Badge></div><div className="mt-3 grid gap-2 text-sm"><p>Date taken: {formatDate(r.dateTaken)}</p><p>Reference range: {r.referenceRange ?? "—"}</p><p>File: {r.fileName ?? "No file uploaded"}</p></div></CardContent></Card>) : <EmptyState title="No lab results found" description="Add lab entries or adjust your search filters." />}</div></div></AppShell>;
}
