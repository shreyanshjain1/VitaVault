import { ShieldCheck, UserRound, HeartPulse, Phone, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { saveHealthProfile } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
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

function filledCount(
  profile: {
    fullName?: string | null;
    dateOfBirth?: Date | null;
    sex?: string | null;
    bloodType?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    chronicConditions?: string | null;
    allergiesSummary?: string | null;
    notes?: string | null;
  } | null
) {
  if (!profile) return 0;

  const values = [
    profile.fullName,
    profile.dateOfBirth,
    profile.sex,
    profile.bloodType,
    profile.heightCm,
    profile.weightKg,
    profile.emergencyContactName,
    profile.emergencyContactPhone,
    profile.chronicConditions,
    profile.allergiesSummary,
    profile.notes,
  ];

  return values.filter((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  }).length;
}

function percentage(
  profile: {
    fullName?: string | null;
    dateOfBirth?: Date | null;
    sex?: string | null;
    bloodType?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    chronicConditions?: string | null;
    allergiesSummary?: string | null;
    notes?: string | null;
  } | null
) {
  const total = 11;
  const done = filledCount(profile);
  return Math.round((done / total) * 100);
}

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

export default async function HealthProfilePage() {
  const user = await requireUser();
  const profile = await db.healthProfile.findUnique({
    where: { userId: user.id },
  });

  const completion = percentage(profile);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Health Profile"
            description="Maintain your baseline information, emergency contact, allergies, and chronic conditions."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{completion}% complete</Badge>
                <Badge className="bg-background/70">Foundational patient record</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <Card className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {profile?.fullName ?? user.name ?? "Patient record"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Personal baseline and safety details
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                  This page anchors the rest of the VitaVault experience. Better baseline data improves summaries,
                  sharing context, exports, and future device-linked trends.
                </p>
              </div>

              <div className="border-t border-border/60 bg-background/40 p-6 lg:border-l lg:border-t-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Readiness
                </p>
                <p className="mt-2 text-3xl font-semibold">{completion}%</p>

                <div className="mt-4 h-2 w-full rounded-full bg-muted/60">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <p className="text-sm font-medium">Why this matters</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      These fields help care-team sharing, patient summaries, and future alert context remain useful and trustworthy.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        This profile is private to your workspace and protected by authenticated server-side access checks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </PageTransition>

        <form action={saveHealthProfile} className="space-y-6">
          <StaggerGroup delay={0.06}>
            <div className="grid gap-6 xl:grid-cols-2">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle>Identity</CardTitle>
                        <CardDescription className="mt-1">
                          Core demographic information for your personal record.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Full name</Label>
                      <Input
                        name="fullName"
                        defaultValue={profile?.fullName ?? ""}
                        placeholder="Juan Dela Cruz"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date of birth</Label>
                      <Input
                        name="dateOfBirth"
                        type="date"
                        defaultValue={formatDateInput(profile?.dateOfBirth)}
                      />
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
                      <Input
                        name="bloodType"
                        defaultValue={profile?.bloodType ?? ""}
                        placeholder="B+"
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <HeartPulse className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle>Physical baseline</CardTitle>
                        <CardDescription className="mt-1">
                          Helps contextualize vitals, trends, and AI summaries.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input
                        name="heightCm"
                        type="number"
                        step="0.01"
                        defaultValue={profile?.heightCm ?? ""}
                        placeholder="174"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input
                        name="weightKg"
                        type="number"
                        step="0.01"
                        defaultValue={profile?.weightKg ?? ""}
                        placeholder="81"
                      />
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/40 p-4 md:col-span-2">
                      <p className="text-sm font-medium">Future use in VitaVault</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This section becomes more valuable later when Android Health Connect, smart scales,
                        and home vital devices begin syncing into the record.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle>Emergency contact</CardTitle>
                        <CardDescription className="mt-1">
                          Store a trusted contact for context and exports.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Emergency contact name</Label>
                      <Input
                        name="emergencyContactName"
                        defaultValue={profile?.emergencyContactName ?? ""}
                        placeholder="Manish Jain"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Emergency contact phone</Label>
                      <Input
                        name="emergencyContactPhone"
                        defaultValue={profile?.emergencyContactPhone ?? ""}
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle>Medical background</CardTitle>
                        <CardDescription className="mt-1">
                          Baseline context for clinicians, caregivers, and future AI summaries.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Chronic conditions</Label>
                      <Textarea
                        name="chronicConditions"
                        defaultValue={profile?.chronicConditions ?? ""}
                        placeholder="List known chronic conditions"
                        className="min-h-[110px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Allergies summary</Label>
                      <Textarea
                        name="allergiesSummary"
                        defaultValue={profile?.allergiesSummary ?? ""}
                        placeholder="Drug, food, or environmental allergies"
                        className="min-h-[110px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>

            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle>Additional notes</CardTitle>
                  <CardDescription className="mt-1">
                    Optional record notes that help round out the patient profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      defaultValue={profile?.notes ?? ""}
                      placeholder="Add any context you want visible in your personal record"
                      className="min-h-[140px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerGroup>

          <div className="sticky bottom-4 z-10">
            <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Save profile changes</p>
                  <p className="text-sm text-muted-foreground">
                    Keep your baseline profile current so summaries, sharing, and exports stay accurate.
                  </p>
                </div>

                <Button type="submit" size="lg">
                  Save profile
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}