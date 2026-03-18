import Link from "next/link";
import { revalidatePath } from "next/cache";
import { HeartPulse, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import {
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
import { healthProfileSchema } from "@/lib/validations";

function calculateProfileCompletion(profile: Awaited<ReturnType<typeof db.healthProfile.findUnique>>) {
  if (!profile) return 0;

  const fields = [
    profile.fullName,
    profile.dateOfBirth,
    profile.sex,
    profile.bloodType,
    profile.heightCm,
    profile.weightKg,
    profile.emergencyContactName,
    profile.emergencyContactPhone,
    profile.allergiesSummary,
    profile.chronicConditions,
    profile.notes,
  ];

  const completed = fields.filter(
    (value) => value !== null && value !== undefined && value !== ""
  ).length;

  return Math.round((completed / fields.length) * 100);
}

export default async function HealthProfilePage() {
  const currentUser = await requireUser();

  const profile = await db.healthProfile.findUnique({
    where: { userId: currentUser.id! },
  });

  const profileCompletion = calculateProfileCompletion(profile);

  async function saveHealthProfile(formData: FormData): Promise<void> {
    "use server";

    const user = await requireUser();

    const parsed = healthProfileSchema.parse({
      fullName: formData.get("fullName"),
      dateOfBirth: formData.get("dateOfBirth"),
      sex: formData.get("sex") || undefined,
      bloodType: formData.get("bloodType") || undefined,
      heightCm: formData.get("heightCm") || undefined,
      weightKg: formData.get("weightKg") || undefined,
      emergencyContactName: formData.get("emergencyContactName") || undefined,
      emergencyContactPhone: formData.get("emergencyContactPhone") || undefined,
      chronicConditions: formData.get("chronicConditions") || undefined,
      allergiesSummary: formData.get("allergiesSummary") || undefined,
      notes: formData.get("notes") || undefined,
    });

    await db.healthProfile.upsert({
      where: { userId: user.id! },
      create: {
        userId: user.id!,
        fullName: parsed.fullName,
        dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
        sex: parsed.sex ?? null,
        bloodType: parsed.bloodType || null,
        heightCm: parsed.heightCm ?? null,
        weightKg: parsed.weightKg ?? null,
        emergencyContactName: parsed.emergencyContactName || null,
        emergencyContactPhone: parsed.emergencyContactPhone || null,
        chronicConditions: parsed.chronicConditions || null,
        allergiesSummary: parsed.allergiesSummary || null,
        notes: parsed.notes || null,
      },
      update: {
        fullName: parsed.fullName,
        dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
        sex: parsed.sex ?? null,
        bloodType: parsed.bloodType || null,
        heightCm: parsed.heightCm ?? null,
        weightKg: parsed.weightKg ?? null,
        emergencyContactName: parsed.emergencyContactName || null,
        emergencyContactPhone: parsed.emergencyContactPhone || null,
        chronicConditions: parsed.chronicConditions || null,
        allergiesSummary: parsed.allergiesSummary || null,
        notes: parsed.notes || null,
      },
    });

    revalidatePath("/health-profile");
    revalidatePath("/dashboard");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Health Profile"
          description="Maintain your baseline details, emergency contacts, and medical context."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Back to dashboard
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.92fr]">
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Baseline record
              </p>
              <CardTitle className="text-3xl leading-tight">
                Patient profile and safety context
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Keep key demographic, emergency, allergy, and chronic condition information current so the rest of VitaVault stays clinically useful.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">Profile completion</p>
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-4xl font-semibold">{profileCompletion}%</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  More complete profiles lead to better summaries and safer collaboration.
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <p className="text-sm font-medium text-muted-foreground">Blood type</p>
                <p className="mt-4 text-2xl font-semibold">{profile?.bloodType ?? "Not set"}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Useful as part of baseline medical context.
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">Safety context</p>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-4 text-2xl font-semibold">
                  {profile?.emergencyContactName ? "Configured" : "Needs review"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Emergency contact and condition context should be kept current.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile summary</CardTitle>
              <CardDescription className="mt-1">
                Quick reference for the most important saved information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Full name</p>
                <p className="mt-1 text-sm font-semibold">{profile?.fullName ?? "Not set"}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Sex</p>
                <p className="mt-1 text-sm font-semibold">{profile?.sex ?? "Not set"}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Height / Weight</p>
                <p className="mt-1 text-sm font-semibold">
                  {profile?.heightCm ?? "—"} cm • {profile?.weightKg ?? "—"} kg
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Emergency contact</p>
                <p className="mt-1 text-sm font-semibold">
                  {profile?.emergencyContactName ?? "Not set"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile?.emergencyContactPhone ?? "No phone saved"}
                </p>
              </div>

              <div className="pt-2">
                <StatusPill tone={profileCompletion >= 80 ? "success" : "warning"}>
                  {profileCompletion >= 80 ? "Healthy baseline coverage" : "Needs more profile detail"}
                </StatusPill>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription className="mt-1">
              Update core health information used throughout your patient workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveHealthProfile} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={profile?.fullName ?? ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={
                      profile?.dateOfBirth
                        ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select id="sex" name="sex" defaultValue={profile?.sex ?? ""}>
                    <option value="">Select sex</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood type</Label>
                  <Input
                    id="bloodType"
                    name="bloodType"
                    defaultValue={profile?.bloodType ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heightCm">Height (cm)</Label>
                  <Input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    step="0.01"
                    defaultValue={profile?.heightCm ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    step="0.01"
                    defaultValue={profile?.weightKg ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Emergency contact name</Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    defaultValue={profile?.emergencyContactName ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    defaultValue={profile?.emergencyContactPhone ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label htmlFor="allergiesSummary">Allergies summary</Label>
                  <Textarea
                    id="allergiesSummary"
                    name="allergiesSummary"
                    rows={4}
                    className="min-h-[120px]"
                    defaultValue={profile?.allergiesSummary ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chronicConditions">Chronic conditions</Label>
                  <Textarea
                    id="chronicConditions"
                    name="chronicConditions"
                    rows={4}
                    className="min-h-[120px]"
                    defaultValue={profile?.chronicConditions ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={5}
                    className="min-h-[140px]"
                    defaultValue={profile?.notes ?? ""}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="rounded-2xl px-5">
                  Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}