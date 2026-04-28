import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  LifeBuoy,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateInput, getOnboardingProgress } from "@/lib/onboarding";
import { saveOnboardingProfile, skipOnboarding } from "./actions";

const stepCards = [
  {
    title: "Baseline identity",
    description: "Set the record owner and demographic context used in summaries.",
    icon: UserRound,
  },
  {
    title: "Safety details",
    description: "Capture allergies, chronic conditions, and emergency contacts.",
    icon: ShieldCheck,
  },
  {
    title: "Care context",
    description: "Add notes that help future exports and care-team collaboration.",
    icon: HeartPulse,
  },
];

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await db.healthProfile.findUnique({ where: { userId: user.id } });
  const progress = getOnboardingProgress(profile);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Set up your VitaVault"
            description="Complete the core patient profile once so your dashboard, summaries, care-team sharing, and future reports have reliable context."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge>{progress.percentage}% onboarding complete</Badge>
                <StatusPill tone={progress.percentage >= 75 ? "success" : "warning"}>
                  {progress.complete}/{progress.total} setup groups ready
                </StatusPill>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <Card className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-tight">First-run health setup</p>
                    <p className="text-sm text-muted-foreground">
                      A guided setup layer for the existing health-profile model.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {stepCards.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="rounded-3xl border border-border/60 bg-background/50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-sm font-semibold">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/60 bg-background/40 p-6 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Readiness</p>
                    <p className="mt-1 text-3xl font-semibold">{progress.percentage}%</p>
                  </div>
                  <LifeBuoy className="h-8 w-8 text-primary" />
                </div>

                <div className="mt-4 h-2 w-full rounded-full bg-muted/60">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {progress.checklist.map((item) => (
                    <div key={item.key} className="flex gap-3 rounded-2xl border border-border/60 bg-background/50 p-3">
                      <CheckCircle2 className={item.complete ? "mt-0.5 h-4 w-4 text-emerald-500" : "mt-0.5 h-4 w-4 text-muted-foreground"} />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </PageTransition>

        <form action={saveOnboardingProfile} className="space-y-6">
          <StaggerGroup delay={0.07}>
            <div className="grid gap-6 xl:grid-cols-2">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle>Step 1 — Identity basics</CardTitle>
                    <CardDescription className="mt-1">
                      These fields appear in patient summaries, exports, and shared care views.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Full name</Label>
                      <Input name="fullName" defaultValue={profile?.fullName ?? user.name ?? ""} placeholder="Juan Dela Cruz" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of birth</Label>
                      <Input name="dateOfBirth" type="date" defaultValue={formatDateInput(profile?.dateOfBirth)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select name="sex" defaultValue={profile?.sex ?? ""}>
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Blood type</Label>
                      <Input name="bloodType" defaultValue={profile?.bloodType ?? ""} placeholder="B+" />
                    </div>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <Input name="heightCm" type="number" step="0.1" defaultValue={profile?.heightCm ?? ""} placeholder="170" />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight</Label>
                      <Input name="weightKg" type="number" step="0.1" defaultValue={profile?.weightKg ?? ""} placeholder="70" />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle>Step 2 — Emergency and safety</CardTitle>
                    <CardDescription className="mt-1">
                      Add the details that matter during doctor visits, urgent reviews, and shared access.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Emergency contact name</Label>
                      <Input name="emergencyContactName" defaultValue={profile?.emergencyContactName ?? ""} placeholder="Maria Dela Cruz" />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency contact phone</Label>
                      <Input name="emergencyContactPhone" defaultValue={profile?.emergencyContactPhone ?? ""} placeholder="0917 000 0000" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Allergies</Label>
                      <Textarea name="allergiesSummary" defaultValue={profile?.allergiesSummary ?? ""} rows={4} placeholder="Penicillin, shellfish, latex, or none known" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Chronic conditions</Label>
                      <Textarea name="chronicConditions" defaultValue={profile?.chronicConditions ?? ""} rows={4} placeholder="Hypertension, diabetes, asthma, or none known" />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerGroup>

          <PageTransition delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Step 3 — Care context</CardTitle>
                <CardDescription className="mt-1">
                  Optional notes help make exports, AI summaries, and care-team handoffs more useful.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile notes</Label>
                  <Textarea
                    name="notes"
                    defaultValue={profile?.notes ?? ""}
                    rows={5}
                    placeholder="Preferred clinic, care preferences, important medical background, or reminders for future visits."
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Ready to continue?</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Saving this setup updates your main health profile and returns you to the dashboard.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button formAction={skipOnboarding} type="submit" variant="outline">
                      Skip for now
                    </Button>
                    <Link
                      href="/health-profile"
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:bg-muted/60"
                    >
                      Open full profile
                    </Link>
                    <Button type="submit">
                      Save and go to dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PageTransition>
        </form>
      </div>
    </AppShell>
  );
}
