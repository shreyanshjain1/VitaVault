import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  FileHeart,
  HeartPulse,
  Pill,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

const features = [
  {
    title: "Medication schedules",
    icon: Pill,
    description: "Track dosage, reminders, and adherence in one flow.",
  },
  {
    title: "Labs and documents",
    icon: FileHeart,
    description: "Store PDFs and important health records securely.",
  },
  {
    title: "Appointments",
    icon: CalendarClock,
    description: "Plan visits, clinic notes, and follow-ups with clarity.",
  },
  {
    title: "Health insights",
    icon: TrendingUp,
    description: "See trends across blood pressure, sugar, and weight.",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <HeartPulse className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">VitaVault</p>
        <p className="text-sm text-muted-foreground">
          Personal Health Record Companion
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-3xl border bg-white/70 px-4 py-4 shadow-sm backdrop-blur md:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="rounded-2xl px-6">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-2xl px-6">Get Started</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div className="space-y-8">
            <Badge className="rounded-full px-4 py-2 text-sm">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Secure, private, and startup-grade UX
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Manage your personal health records in one polished workspace.
              </h1>

              <p className="max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                VitaVault gives patients a premium dashboard for medications,
                appointments, labs, vitals, symptoms, documents, reminders, and
                printable summaries.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-2xl px-7">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-2xl px-7">
                  View demo
                </Button>
              </Link>
            </div>
          </div>

          <Card className="rounded-[2rem] border bg-white/80 shadow-xl backdrop-blur">
            <CardHeader className="space-y-3">
              <CardTitle className="text-4xl">Flagship health dashboard</CardTitle>
              <CardDescription className="text-lg">
                Beautiful cards, fast actions, charts, reminders, and activity
                history.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-3xl border bg-background/80 p-6 shadow-sm"
                  >
                    <Icon className="mb-4 h-7 w-7 text-primary" />
                    <h3 className="mb-2 text-2xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-7 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}