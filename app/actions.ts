"use server";

import bcrypt from "bcryptjs";
import {
  MedicationLogStatus,
  type AppointmentStatus,
  type DocumentType,
  type LabFlag,
  type MedicationStatus,
  type SymptomSeverity,
} from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveUpload } from "@/lib/upload";
import { healthProfileSchema, signupSchema } from "@/lib/validations";

export type AuthActionState = {
  error: string | null;
  success: string | null;
};

export async function signupAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      success: null,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await db.user.findUnique({ where: { email } });

  if (exists) {
    return {
      error: "An account with that email already exists.",
      success: null,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      healthProfile: {
        create: {
          fullName: parsed.data.name,
        },
      },
    },
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirect: false,
  });

  redirect("/dashboard");
}

export async function loginAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      error: "Email and password are required.",
      success: null,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    redirect("/dashboard");
  } catch {
    return {
      error: "Invalid email or password.",
      success: null,
    };
  }
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
      name: String(formData.get("name") || "").trim(),
      specialty: String(formData.get("specialty") || "").trim() || null,
      clinic: String(formData.get("clinic") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  revalidatePath("/doctors");
  revalidatePath("/medications");
  revalidatePath("/appointments");
}

export async function saveMedication(formData: FormData) {
  const user = await requireUser();
  const scheduleTimes = formData
    .getAll("scheduleTimes")
    .map(String)
    .map((time) => time.trim())
    .filter(Boolean);

  await db.medication.create({
    data: {
      userId: user.id,
      doctorId: String(formData.get("doctorId") || "").trim() || null,
      name: String(formData.get("name") || "").trim(),
      dosage: String(formData.get("dosage") || "").trim(),
      frequency: String(formData.get("frequency") || "").trim(),
      instructions: String(formData.get("instructions") || "").trim() || null,
      startDate: new Date(String(formData.get("startDate"))),
      endDate: String(formData.get("endDate") || "").trim()
        ? new Date(String(formData.get("endDate")))
        : null,
      status: String(formData.get("status") || "ACTIVE") as MedicationStatus,
      active: formData.get("active") === "on",
      schedules: {
        create: scheduleTimes.map((time) => ({
          timeOfDay: time,
        })),
      },
    },
  });

  revalidatePath("/medications");
  revalidatePath("/dashboard");
}

export async function logMedicationStatus(formData: FormData) {
  const user = await requireUser();
  const medicationId = String(formData.get("medicationId") || "").trim();
  const scheduleTime = String(formData.get("scheduleTime") || "").trim() || null;
  const status = String(formData.get("status") || "TAKEN") as MedicationLogStatus;
  const notes = String(formData.get("notes") || "").trim() || null;

  const medication = await db.medication.findFirst({
    where: { id: medicationId, userId: user.id },
    include: { schedules: true },
  });

  if (!medication) {
    throw new Error("Medication not found.");
  }

  if (
    scheduleTime &&
    !medication.schedules.some((schedule) => schedule.timeOfDay === scheduleTime)
  ) {
    throw new Error("Invalid schedule time for this medication.");
  }

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const existingLog = await db.medicationLog.findFirst({
    where: {
      userId: user.id,
      medicationId,
      scheduleTime,
      loggedAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    orderBy: {
      loggedAt: "desc",
    },
  });

  if (existingLog) {
    await db.medicationLog.update({
      where: { id: existingLog.id },
      data: {
        status,
        notes,
        loggedAt: now,
      },
    });
  } else {
    await db.medicationLog.create({
      data: {
        userId: user.id,
        medicationId,
        scheduleTime,
        status,
        notes,
      },
    });
  }

  revalidatePath("/medications");
  revalidatePath("/dashboard");
}

export async function saveAppointment(formData: FormData) {
  const user = await requireUser();

  await db.appointment.create({
    data: {
      userId: user.id,
      clinic: String(formData.get("clinic") || "").trim(),
      specialty: String(formData.get("specialty") || "").trim() || null,
      doctorName: String(formData.get("doctorName") || "").trim(),
      doctorId: String(formData.get("doctorId") || "").trim() || null,
      scheduledAt: new Date(String(formData.get("scheduledAt"))),
      purpose: String(formData.get("purpose") || "").trim(),
      notes: String(formData.get("notes") || "").trim() || null,
      followUpNotes: String(formData.get("followUpNotes") || "").trim() || null,
      status: String(formData.get("status") || "UPCOMING") as AppointmentStatus,
    },
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

export async function saveLabResult(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");

  let uploadData: {
    fileName?: string;
    filePath?: string;
    mimeType?: string;
    fileSize?: number;
  } = {};

  if (file instanceof File && file.size > 0) {
    uploadData = await saveUpload(file);
  }

  await db.labResult.create({
    data: {
      userId: user.id,
      testName: String(formData.get("testName") || "").trim(),
      dateTaken: new Date(String(formData.get("dateTaken"))),
      resultSummary: String(formData.get("resultSummary") || "").trim(),
      referenceRange: String(formData.get("referenceRange") || "").trim() || null,
      flag: String(formData.get("flag") || "NORMAL") as LabFlag,
      ...uploadData,
    },
  });

  revalidatePath("/labs");
  revalidatePath("/dashboard");
}

export async function saveVital(formData: FormData) {
  const user = await requireUser();

  const num = (name: string) => {
    const value = String(formData.get(name) || "").trim();
    return value ? Number(value) : null;
  };

  await db.vitalRecord.create({
    data: {
      userId: user.id,
      recordedAt: new Date(String(formData.get("recordedAt"))),
      systolic: num("systolic"),
      diastolic: num("diastolic"),
      heartRate: num("heartRate"),
      bloodSugar: num("bloodSugar"),
      oxygenSaturation: num("oxygenSaturation"),
      temperatureC: num("temperatureC"),
      weightKg: num("weightKg"),
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  revalidatePath("/vitals");
  revalidatePath("/dashboard");
}

export async function saveSymptom(formData: FormData) {
  const user = await requireUser();

  await db.symptomEntry.create({
    data: {
      userId: user.id,
      title: String(formData.get("title") || "").trim(),
      severity: String(formData.get("severity") || "MILD") as SymptomSeverity,
      bodyArea: String(formData.get("bodyArea") || "").trim() || null,
      startedAt: new Date(String(formData.get("startedAt"))),
      duration: String(formData.get("duration") || "").trim() || null,
      trigger: String(formData.get("trigger") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      resolved: formData.get("resolved") === "on",
    },
  });

  revalidatePath("/symptoms");
  revalidatePath("/dashboard");
}

export async function saveVaccination(formData: FormData) {
  const user = await requireUser();

  await db.vaccinationRecord.create({
    data: {
      userId: user.id,
      vaccineName: String(formData.get("vaccineName") || "").trim(),
      doseNumber: Number(formData.get("doseNumber")),
      dateTaken: new Date(String(formData.get("dateTaken"))),
      location: String(formData.get("location") || "").trim() || null,
      nextDueDate: String(formData.get("nextDueDate") || "").trim()
        ? new Date(String(formData.get("nextDueDate")))
        : null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  revalidatePath("/vaccinations");
  revalidatePath("/dashboard");
}

export async function uploadDocument(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file is required.");
  }

  const upload = await saveUpload(file);

  await db.medicalDocument.create({
    data: {
      userId: user.id,
      title: String(formData.get("title") || "").trim(),
      type: String(formData.get("type") || "OTHER") as DocumentType,
      notes: String(formData.get("notes") || "").trim() || null,
      ...upload,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}