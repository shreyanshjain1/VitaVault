"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MedicationLogStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { signIn } from "@/lib/auth";
import { signupSchema, healthProfileSchema } from "@/lib/validations";
import { saveUpload } from "@/lib/upload";

export async function signupAction(_: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const email = parsed.data.email.toLowerCase();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "An account with that email already exists." };
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.create({ data: { name: parsed.data.name, email, passwordHash, healthProfile: { create: { fullName: parsed.data.name } } } });
  await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  redirect("/dashboard");
}

export async function saveHealthProfile(formData: FormData) {
  const user = await requireUser();
  const userId = user.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsed = healthProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    sex: formData.get("sex") || undefined,
    bloodType: formData.get("bloodType"),
    heightCm: formData.get("heightCm") || undefined,
    weightKg: formData.get("weightKg") || undefined,
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    chronicConditions: formData.get("chronicConditions"),
    allergiesSummary: formData.get("allergiesSummary"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const profileData = {
    fullName: parsed.data.fullName,
    dateOfBirth: parsed.data.dateOfBirth
      ? new Date(parsed.data.dateOfBirth)
      : null,
    sex: parsed.data.sex,
    bloodType: parsed.data.bloodType || null,
    heightCm:
      parsed.data.heightCm !== undefined && parsed.data.heightCm !== null
        ? Number(parsed.data.heightCm)
        : null,
    weightKg:
      parsed.data.weightKg !== undefined && parsed.data.weightKg !== null
        ? Number(parsed.data.weightKg)
        : null,
    emergencyContactName: parsed.data.emergencyContactName || null,
    emergencyContactPhone: parsed.data.emergencyContactPhone || null,
    chronicConditions: parsed.data.chronicConditions || null,
    allergiesSummary: parsed.data.allergiesSummary || null,
    notes: parsed.data.notes || null,
  };

  await db.healthProfile.upsert({
    where: { userId },
    update: profileData,
    create: {
      ...profileData,
      user: {
        connect: { id: userId },
      },
    },
  });

  revalidatePath("/health-profile");
  revalidatePath("/dashboard");
}

export async function addDoctor(formData: FormData) {
  const user = await requireUser();
  await db.doctor.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") || ""),
      specialty: String(formData.get("specialty") || "") || null,
      clinic: String(formData.get("clinic") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      notes: String(formData.get("notes") || "") || null
    }
  });
  revalidatePath("/doctors"); revalidatePath("/medications"); revalidatePath("/appointments");
}

export async function saveMedication(formData: FormData) {
  const user = await requireUser();
  const scheduleTimes = formData.getAll("scheduleTimes").map(String).filter(Boolean);
  await db.medication.create({
    data: {
      userId: user.id,
      doctorId: String(formData.get("doctorId") || "") || null,
      name: String(formData.get("name") || ""),
      dosage: String(formData.get("dosage") || ""),
      frequency: String(formData.get("frequency") || ""),
      instructions: String(formData.get("instructions") || "") || null,
      startDate: new Date(String(formData.get("startDate"))),
      endDate: String(formData.get("endDate") || "") ? new Date(String(formData.get("endDate"))) : null,
      status: String(formData.get("status") || "ACTIVE") as any,
      active: formData.get("active") === "on",
      schedules: { create: scheduleTimes.map((time) => ({ timeOfDay: time })) }
    }
  });
  revalidatePath("/medications"); revalidatePath("/dashboard");
}

export async function logMedicationStatus(formData: FormData) {
  const user = await requireUser();
  const medicationId = String(formData.get("medicationId"));
  const medication = await db.medication.findFirst({ where: { id: medicationId, userId: user.id } });
  if (!medication) throw new Error("Medication not found.");
  await db.medicationLog.create({
    data: {
      userId: user.id,
      medicationId,
      scheduleTime: String(formData.get("scheduleTime") || "") || null,
      status: String(formData.get("status") || "TAKEN") as MedicationLogStatus,
      notes: String(formData.get("notes") || "") || null
    }
  });
  revalidatePath("/medications"); revalidatePath("/dashboard");
}

export async function saveAppointment(formData: FormData) {
  const user = await requireUser();
  await db.appointment.create({
    data: {
      userId: user.id,
      clinic: String(formData.get("clinic") || ""),
      specialty: String(formData.get("specialty") || "") || null,
      doctorName: String(formData.get("doctorName") || ""),
      doctorId: String(formData.get("doctorId") || "") || null,
      scheduledAt: new Date(String(formData.get("scheduledAt"))),
      purpose: String(formData.get("purpose") || ""),
      notes: String(formData.get("notes") || "") || null,
      followUpNotes: String(formData.get("followUpNotes") || "") || null,
      status: String(formData.get("status") || "UPCOMING") as any
    }
  });
  revalidatePath("/appointments"); revalidatePath("/dashboard");
}

export async function saveLabResult(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  let uploadData: any = {};
  if (file instanceof File && file.size > 0) uploadData = await saveUpload(file);
  await db.labResult.create({
    data: {
      userId: user.id,
      testName: String(formData.get("testName") || ""),
      dateTaken: new Date(String(formData.get("dateTaken"))),
      resultSummary: String(formData.get("resultSummary") || ""),
      referenceRange: String(formData.get("referenceRange") || "") || null,
      flag: String(formData.get("flag") || "NORMAL") as any,
      ...uploadData
    }
  });
  revalidatePath("/labs"); revalidatePath("/dashboard");
}

export async function saveVital(formData: FormData) {
  const user = await requireUser();
  const num = (name: string) => { const v = String(formData.get(name) || ""); return v ? Number(v) : null; };
  await db.vitalRecord.create({
    data: {
      userId: user.id,
      recordedAt: new Date(String(formData.get("recordedAt"))),
      systolic: num("systolic"), diastolic: num("diastolic"), heartRate: num("heartRate"),
      bloodSugar: num("bloodSugar"), oxygenSaturation: num("oxygenSaturation"), temperatureC: num("temperatureC"), weightKg: num("weightKg"),
      notes: String(formData.get("notes") || "") || null
    }
  });
  revalidatePath("/vitals"); revalidatePath("/dashboard");
}

export async function saveSymptom(formData: FormData) {
  const user = await requireUser();
  await db.symptomEntry.create({
    data: {
      userId: user.id,
      title: String(formData.get("title") || ""),
      severity: String(formData.get("severity") || "MILD") as any,
      bodyArea: String(formData.get("bodyArea") || "") || null,
      startedAt: new Date(String(formData.get("startedAt"))),
      duration: String(formData.get("duration") || "") || null,
      trigger: String(formData.get("trigger") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      resolved: formData.get("resolved") === "on"
    }
  });
  revalidatePath("/symptoms"); revalidatePath("/dashboard");
}

export async function saveVaccination(formData: FormData) {
  const user = await requireUser();
  await db.vaccinationRecord.create({
    data: {
      userId: user.id,
      vaccineName: String(formData.get("vaccineName") || ""),
      doseNumber: Number(formData.get("doseNumber")),
      dateTaken: new Date(String(formData.get("dateTaken"))),
      location: String(formData.get("location") || "") || null,
      nextDueDate: String(formData.get("nextDueDate") || "") ? new Date(String(formData.get("nextDueDate"))) : null,
      notes: String(formData.get("notes") || "") || null
    }
  });
  revalidatePath("/vaccinations"); revalidatePath("/dashboard");
}

export async function uploadDocument(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("A file is required.");
  const upload = await saveUpload(file);
  await db.medicalDocument.create({
    data: {
      userId: user.id,
      title: String(formData.get("title") || ""),
      type: String(formData.get("type") || "OTHER") as any,
      notes: String(formData.get("notes") || "") || null,
      ...upload
    }
  });
  revalidatePath("/documents"); revalidatePath("/dashboard");
}
