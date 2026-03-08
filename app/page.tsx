import Link from "next/link";
import { ArrowRight, CalendarClock, FileHeart, Pill, ShieldCheck, TrendingUp, HeartPulse } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

const features = [
  { title: "Medication schedules", icon: Pill, description: "Track dosage, reminders, and adherence in one flow." },
  { title: "Labs and documents", icon: FileHeart, description: "Store PDFs and important health records securely." },
  { title: "Appointments", icon: CalendarClock, description: "Plan visits, clinic notes, and follow-ups with clarity." },
  { title: "Health insights", icon: TrendingUp, description: "See trends across blood pressure, sugar, and weight." }
];
function Logo() {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><HeartPulse className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Health Companion</p><p className="text-xs text-muted-foreground">Personal Health Record</p></div></div>;
}
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <header className="flex items-center justify-between"><Logo /><div className="flex gap-3"><Link href="/login"><Button variant="outline">Login</Button></Link><Link href="/signup"><Button>Get Started</Button></Link></div></header>
        <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm"><ShieldCheck className="h-4 w-4 text-primary" />Secure, private, and startup-grade UX</div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">Manage your personal health records in one polished workspace.</h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Personal Health Record Companion gives patients a premium dashboard for medications, appointments, labs, vitals, symptoms, documents, reminders, and printable summaries.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href="/signup"><Button size="lg">Create account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link href="/login"><Button size="lg" variant="outline">View demo</Button></Link></div>
          </div>
          <Card className="overflow-hidden bg-card/90">
            <CardHeader><CardTitle>Flagship health dashboard</CardTitle><CardDescription>Beautiful cards, fast actions, charts, reminders, and activity history.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">{features.map((feature) => { const Icon = feature.icon; return <div key={feature.title} className="rounded-2xl border bg-background p-4"><Icon className="mb-3 h-5 w-5 text-primary" /><h3 className="font-medium">{feature.title}</h3><p className="mt-2 text-sm text-muted-foreground">{feature.description}</p></div>; })}</CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
