"use server";

import type { Sex } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { healthProfileSchema } from "@/lib/validations";

export async function saveOnboardingProfile(formData: FormData) {
  const user = await requireUser();

  const rawSex = String(formData.get("sex") || "").trim();
  const rawBloodType = String(formData.get("bloodType") || "").trim();
  const rawDateOfBirth = String(formData.get("dateOfBirth") || "").trim();
  const rawHeightCm = String(formData.get("heightCm") || "").trim();
  const rawWeightKg = String(formData.get("weightKg") || "").trim();

  const parsed = healthProfileSchema.safeParse({
    fullName: String(formData.get("fullName") || user.name || "").trim(),
    dateOfBirth: rawDateOfBirth || undefined,
    sex: rawSex || undefined,
    bloodType: rawBloodType || undefined,
    heightCm: rawHeightCm || undefined,
    weightKg: rawWeightKg || undefined,
    emergencyContactName:
      String(formData.get("emergencyContactName") || "").trim() || undefined,
    emergencyContactPhone:
      String(formData.get("emergencyContactPhone") || "").trim() || undefined,
    chronicConditions:
      String(formData.get("chronicConditions") || "").trim() || undefined,
    allergiesSummary:
      String(formData.get("allergiesSummary") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid onboarding profile data."
    );
  }

  await db.healthProfile.upsert({
    where: { userId: user.id },
    update: {
      fullName: parsed.data.fullName.trim(),
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      sex: (parsed.data.sex as Sex | undefined) ?? null,
      bloodType: parsed.data.bloodType?.trim() || null,
      heightCm: parsed.data.heightCm != null ? Number(parsed.data.heightCm) : null,
      weightKg: parsed.data.weightKg != null ? Number(parsed.data.weightKg) : null,
      emergencyContactName: parsed.data.emergencyContactName?.trim() || null,
      emergencyContactPhone: parsed.data.emergencyContactPhone?.trim() || null,
      chronicConditions: parsed.data.chronicConditions?.trim() || null,
      allergiesSummary: parsed.data.allergiesSummary?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
    },
    create: {
      userId: user.id,
      fullName: parsed.data.fullName.trim(),
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      sex: (parsed.data.sex as Sex | undefined) ?? null,
      bloodType: parsed.data.bloodType?.trim() || null,
      heightCm: parsed.data.heightCm != null ? Number(parsed.data.heightCm) : null,
      weightKg: parsed.data.weightKg != null ? Number(parsed.data.weightKg) : null,
      emergencyContactName: parsed.data.emergencyContactName?.trim() || null,
      emergencyContactPhone: parsed.data.emergencyContactPhone?.trim() || null,
      chronicConditions: parsed.data.chronicConditions?.trim() || null,
      allergiesSummary: parsed.data.allergiesSummary?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/health-profile");

  redirect("/dashboard");
}

export async function skipOnboarding() {
  redirect("/dashboard");
}
