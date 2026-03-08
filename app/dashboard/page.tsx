import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";
import { AreaTrendChart, AdherenceChart, TrendChart } from "@/components/charts";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/40">
            <CardHeader><CardTitle>Welcome back, {data.profile?.fullName ?? user.name ?? "there"}</CardTitle><CardDescription>Stay on top of medications, labs, symptoms, and appointments in one premium dashboard.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-background/80 p-4"><p className="text-sm text-muted-foreground">Profile completion</p><p className="mt-2 text-3xl font-semibold">{data.profileCompletion}%</p></div>
              <div className="rounded-2xl border bg-background/80 p-4"><p className="text-sm text-muted-foreground">Next medication</p><p className="mt-2 text-lg font-semibold">{data.nextMedication?.name ?? "No active medication"}</p><p className="text-sm text-muted-foreground">{data.nextMedication?.time ?? "—"}</p></div>
              <div className="rounded-2xl border bg-background/80 p-4"><p className="text-sm text-muted-foreground">Upcoming appointment</p><p className="mt-2 text-lg font-semibold">{data.appointments[0]?.doctorName ?? "No upcoming visit"}</p><p className="text-sm text-muted-foreground">{formatDateTime(data.appointments[0]?.scheduledAt)}</p></div>
              <div className="rounded-2xl border bg-background/80 p-4"><p className="text-sm text-muted-foreground">Latest lab</p><p className="mt-2 text-lg font-semibold">{data.labs[0]?.testName ?? "No lab yet"}</p><p className="text-sm text-muted-foreground">{data.labs[0]?.resultSummary ?? "—"}</p></div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Quick actions</CardTitle><CardDescription>Jump into your most common health tasks.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Link href="/medications"><Button variant="outline" className="w-full justify-start">Add medication</Button></Link><Link href="/appointments"><Button variant="outline" className="w-full justify-start">Schedule appointment</Button></Link><Link href="/labs"><Button variant="outline" className="w-full justify-start">Upload lab result</Button></Link><Link href="/vitals"><Button variant="outline" className="w-full justify-start">Log vitals</Button></Link><Link href="/symptoms"><Button variant="outline" className="w-full justify-start">Add symptom</Button></Link><Link href="/summary"><Button className="w-full justify-start">Print summary</Button></Link></CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Blood pressure trend</CardTitle></CardHeader><CardContent><TrendChart data={data.bloodPressureTrend} lines={[{ key: "systolic", name: "Systolic" }, { key: "diastolic", name: "Diastolic" }]} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Weight trend</CardTitle></CardHeader><CardContent><AreaTrendChart data={data.weightTrend} keyName="weight" name="Weight" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Blood sugar trend</CardTitle></CardHeader><CardContent><AreaTrendChart data={data.sugarTrend} keyName="sugar" name="Blood sugar" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Medication adherence</CardTitle></CardHeader><CardContent><AdherenceChart data={data.adherenceTrend} /></CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card><CardHeader><CardTitle>Reminders</CardTitle></CardHeader><CardContent className="space-y-3">{data.reminders.length ? data.reminders.map(item => <div key={item.id} className="rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.title}</p><Badge>{item.type.replaceAll("_"," ")}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.dueAt)}</p></div>) : <p className="text-sm text-muted-foreground">No upcoming reminders.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Health alerts</CardTitle></CardHeader><CardContent className="space-y-3">{data.healthAlerts.length ? data.healthAlerts.map((alert, i) => <div key={i} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{alert}</div>) : <p className="text-sm text-muted-foreground">No active alerts. Great job staying on track.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent className="space-y-3">{data.symptoms.map(item => <div key={item.id} className="rounded-2xl border p-4"><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.notes ?? "No notes"}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.startedAt)}</p></div>)}</CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Upcoming appointments</CardTitle></CardHeader><CardContent className="space-y-3">{data.appointments.map(item => <div key={item.id} className="rounded-2xl border p-4"><div className="flex items-center justify-between"><div><p className="font-medium">{item.purpose}</p><p className="text-sm text-muted-foreground">{item.doctorName} • {item.clinic}</p></div><Badge>{item.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.scheduledAt)}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Latest lab results</CardTitle></CardHeader><CardContent className="space-y-3">{data.labs.map(item => <div key={item.id} className="rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.testName}</p><Badge className={item.flag === "NORMAL" ? "" : "border-destructive/30 bg-destructive/5 text-destructive"}>{item.flag}</Badge></div><p className="text-sm text-muted-foreground">{item.resultSummary}</p><p className="mt-2 text-xs text-muted-foreground">{formatDate(item.dateTaken)}</p></div>)}</CardContent></Card>
        </div>
      </div>
    </AppShell>
  );
}
