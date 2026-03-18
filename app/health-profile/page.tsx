import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { healthProfileSchema } from "@/lib/validations";

export default async function HealthProfilePage() {
  const currentUser = await requireUser();

  const profile = await db.healthProfile.findUnique({
    where: { userId: currentUser.id! },
  });

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
      <div className="space-y-6">
        <PageHeader
          title="Health Profile"
          description="Maintain your baseline details, emergency contacts, and medical context."
        />

        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveHealthProfile} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={profile?.fullName ?? ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of birth
                  </label>
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
                  <label htmlFor="sex" className="text-sm font-medium">
                    Sex
                  </label>
                  <Select id="sex" name="sex" defaultValue={profile?.sex ?? ""}>
                    <option value="">Select sex</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bloodType" className="text-sm font-medium">
                    Blood type
                  </label>
                  <Input
                    id="bloodType"
                    name="bloodType"
                    defaultValue={profile?.bloodType ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="heightCm" className="text-sm font-medium">
                    Height (cm)
                  </label>
                  <Input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    step="0.01"
                    defaultValue={profile?.heightCm ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="weightKg" className="text-sm font-medium">
                    Weight (kg)
                  </label>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    step="0.01"
                    defaultValue={profile?.weightKg ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="emergencyContactName"
                    className="text-sm font-medium"
                  >
                    Emergency contact name
                  </label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    defaultValue={profile?.emergencyContactName ?? ""}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="emergencyContactPhone"
                    className="text-sm font-medium"
                  >
                    Emergency contact phone
                  </label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    defaultValue={profile?.emergencyContactPhone ?? ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="allergiesSummary" className="text-sm font-medium">
                  Allergies summary
                </label>
                <Textarea
                  id="allergiesSummary"
                  name="allergiesSummary"
                  rows={4}
                  defaultValue={profile?.allergiesSummary ?? ""}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="chronicConditions" className="text-sm font-medium">
                  Chronic conditions
                </label>
                <Textarea
                  id="chronicConditions"
                  name="chronicConditions"
                  rows={4}
                  defaultValue={profile?.chronicConditions ?? ""}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={5}
                  defaultValue={profile?.notes ?? ""}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Save profile</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}