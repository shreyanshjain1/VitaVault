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
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveUpload } from "@/lib/upload";
import { healthProfileSchema, signupSchema } from "@/lib/validations";

export type AuthActionState = {
  error: string | null;
  success: string | null;
};

function safeCallbackUrl(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function requiredString(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function optionalString(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();
  return value || null;
}

function requiredDate(formData: FormData, name: string) {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) throw new Error(`${name} is required.`);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(`${name} is invalid.`);
  return date;
}

function optionalDate(formData: FormData, name: string) {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(`${name} is invalid.`);
  return date;
}

function optionalNumber(formData: FormData, name: string) {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`${name} must be a valid number.`);
  return value;
}

function optionalInteger(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);
  if (value == null) return null;
  if (!Number.isInteger(value)) throw new Error(`${name} must be a whole number.`);
  return value;
}

function normalizeScheduleTimes(formData: FormData) {
  return formData
    .getAll("scheduleTimes")
    .map(String)
    .map((time) => time.trim())
    .filter(Boolean);
}

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

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "An account with that email already exists.", success: null };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      healthProfile: {
        create: {
          fullName: parsed.data.name.trim(),
        },
      },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    return {
      error: "Account created, but automatic sign-in failed. Please log in manually.",
      success: null,
    };
  }

  redirect(callbackUrl);
}

export async function loginAction(
  _: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  if (!email || !password) {
    return { error: "Email and password are required.", success: null };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return { error: "Invalid email or password.", success: null };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password.", success: null };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    return { error: "Unable to start session. Please try again.", success: null };
  }

  redirect(callbackUrl);
}

export async function saveHealthProfile(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const userEmail = session.user.email?.trim().toLowerCase() ?? "";
  const userName = session.user.name?.trim() || null;

  const rawSex = String(formData.get("sex") || "").trim();
  const rawBloodType = String(formData.get("bloodType") || "").trim();
  const rawDateOfBirth = String(formData.get("dateOfBirth") || "").trim();
  const rawHeightCm = String(formData.get("heightCm") || "").trim();
  const rawWeightKg = String(formData.get("weightKg") || "").trim();

  const parsed = healthProfileSchema.safeParse({
    fullName: String(formData.get("fullName") || "").trim(),
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
      parsed.error.issues[0]?.message ?? "Invalid health profile data."
    );
  }

  if (!userEmail) {
    throw new Error("Signed-in user has no email address.");
  }

  const profileData = {
    fullName: parsed.data.fullName.trim(),
    dateOfBirth: parsed.data.dateOfBirth
      ? new Date(parsed.data.dateOfBirth)
      : null,
    sex: parsed.data.sex ?? null,
    bloodType: parsed.data.bloodType?.trim() || null,
    heightCm:
      parsed.data.heightCm != null ? Number(parsed.data.heightCm) : null,
    weightKg:
      parsed.data.weightKg != null ? Number(parsed.data.weightKg) : null,
    emergencyContactName: parsed.data.emergencyContactName?.trim() || null,
    emergencyContactPhone: parsed.data.emergencyContactPhone?.trim() || null,
    chronicConditions: parsed.data.chronicConditions?.trim() || null,
    allergiesSummary: parsed.data.allergiesSummary?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  };

  await db.user.upsert({
    where: { id: userId },
    update: {
      email: userEmail,
      name: userName,
    },
    create: {
      id: userId,
      email: userEmail,
      name: userName,
      role: "PATIENT",
    },
  });

  await db.healthProfile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      ...profileData,
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
      name: requiredString(formData, "name"),
      specialty: optionalString(formData, "specialty"),
      clinic: optionalString(formData, "clinic"),
      phone: optionalString(formData, "phone"),
      email: optionalString(formData, "email"),
      address: optionalString(formData, "address"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/doctors");
  revalidatePath("/medications");
  revalidatePath("/appointments");
}

export async function saveMedication(formData: FormData) {
  const user = await requireUser();
  const scheduleTimes = normalizeScheduleTimes(formData);

  await db.medication.create({
    data: {
      userId: user.id,
      doctorId: optionalString(formData, "doctorId"),
      name: requiredString(formData, "name"),
      dosage: requiredString(formData, "dosage"),
      frequency: requiredString(formData, "frequency"),
      instructions: optionalString(formData, "instructions"),
      startDate: requiredDate(formData, "startDate"),
      endDate: optionalDate(formData, "endDate"),
      status: String(formData.get("status") || "ACTIVE") as MedicationStatus,
      active: formData.get("active") === "on",
      schedules: {
        create: scheduleTimes.map((time) => ({ timeOfDay: time })),
      },
    },
  });

  revalidatePath("/medications");
  revalidatePath("/dashboard");
}

export async function updateMedication(formData: FormData) {
  const user = await requireUser();
  const medicationId = requiredString(formData, "medicationId");
  const scheduleTimes = normalizeScheduleTimes(formData);

  const existing = await db.medication.findFirst({
    where: { id: medicationId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Medication not found.");

  await db.medication.update({
    where: { id: medicationId },
    data: {
      doctorId: optionalString(formData, "doctorId"),
      name: requiredString(formData, "name"),
      dosage: requiredString(formData, "dosage"),
      frequency: requiredString(formData, "frequency"),
      instructions: optionalString(formData, "instructions"),
      startDate: requiredDate(formData, "startDate"),
      endDate: optionalDate(formData, "endDate"),
      status: String(formData.get("status") || "ACTIVE") as MedicationStatus,
      active: formData.get("active") === "on",
      schedules: {
        deleteMany: {},
        create: scheduleTimes.map((time) => ({ timeOfDay: time })),
      },
    },
  });

  revalidatePath("/medications");
  revalidatePath("/dashboard");
}

export async function deleteMedication(formData: FormData) {
  const user = await requireUser();
  const medicationId = requiredString(formData, "medicationId");

  const existing = await db.medication.findFirst({
    where: { id: medicationId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Medication not found.");

  await db.medication.delete({ where: { id: medicationId } });

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

  if (!medication) throw new Error("Medication not found.");

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
      loggedAt: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { loggedAt: "desc" },
  });

  if (existingLog) {
    await db.medicationLog.update({
      where: { id: existingLog.id },
      data: { status, notes, loggedAt: now },
    });
  } else {
    await db.medicationLog.create({
      data: { userId: user.id, medicationId, scheduleTime, status, notes },
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
      clinic: requiredString(formData, "clinic"),
      specialty: optionalString(formData, "specialty"),
      doctorName: requiredString(formData, "doctorName"),
      doctorId: optionalString(formData, "doctorId"),
      scheduledAt: requiredDate(formData, "scheduledAt"),
      purpose: requiredString(formData, "purpose"),
      notes: optionalString(formData, "notes"),
      followUpNotes: optionalString(formData, "followUpNotes"),
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
      testName: requiredString(formData, "testName"),
      dateTaken: requiredDate(formData, "dateTaken"),
      resultSummary: requiredString(formData, "resultSummary"),
      referenceRange: optionalString(formData, "referenceRange"),
      flag: String(formData.get("flag") || "NORMAL") as LabFlag,
      ...uploadData,
    },
  });

  revalidatePath("/labs");
  revalidatePath("/dashboard");
}

export async function saveVital(formData: FormData) {
  const user = await requireUser();

  await db.vitalRecord.create({
    data: {
      userId: user.id,
      recordedAt: requiredDate(formData, "recordedAt"),
      systolic: optionalInteger(formData, "systolic"),
      diastolic: optionalInteger(formData, "diastolic"),
      heartRate: optionalInteger(formData, "heartRate"),
      bloodSugar: optionalNumber(formData, "bloodSugar"),
      oxygenSaturation: optionalInteger(formData, "oxygenSaturation"),
      temperatureC: optionalNumber(formData, "temperatureC"),
      weightKg: optionalNumber(formData, "weightKg"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/vitals");
  revalidatePath("/dashboard");
}

export async function updateVital(formData: FormData) {
  const user = await requireUser();
  const vitalId = requiredString(formData, "vitalId");

  const existing = await db.vitalRecord.findFirst({
    where: { id: vitalId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Vital record not found.");

  await db.vitalRecord.update({
    where: { id: vitalId },
    data: {
      recordedAt: requiredDate(formData, "recordedAt"),
      systolic: optionalInteger(formData, "systolic"),
      diastolic: optionalInteger(formData, "diastolic"),
      heartRate: optionalInteger(formData, "heartRate"),
      bloodSugar: optionalNumber(formData, "bloodSugar"),
      oxygenSaturation: optionalInteger(formData, "oxygenSaturation"),
      temperatureC: optionalNumber(formData, "temperatureC"),
      weightKg: optionalNumber(formData, "weightKg"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/vitals");
  revalidatePath("/dashboard");
}

export async function deleteVital(formData: FormData) {
  const user = await requireUser();
  const vitalId = requiredString(formData, "vitalId");

  const existing = await db.vitalRecord.findFirst({
    where: { id: vitalId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Vital record not found.");

  await db.vitalRecord.delete({ where: { id: vitalId } });

  revalidatePath("/vitals");
  revalidatePath("/dashboard");
}

export async function saveSymptom(formData: FormData) {
  const user = await requireUser();

  await db.symptomEntry.create({
    data: {
      userId: user.id,
      title: requiredString(formData, "title"),
      severity: String(formData.get("severity") || "MILD") as SymptomSeverity,
      bodyArea: optionalString(formData, "bodyArea"),
      startedAt: requiredDate(formData, "startedAt"),
      duration: optionalString(formData, "duration"),
      trigger: optionalString(formData, "trigger"),
      notes: optionalString(formData, "notes"),
      resolved: formData.get("resolved") === "on",
    },
  });

  revalidatePath("/symptoms");
  revalidatePath("/dashboard");
}

export async function updateSymptom(formData: FormData) {
  const user = await requireUser();
  const symptomId = requiredString(formData, "symptomId");

  const existing = await db.symptomEntry.findFirst({
    where: { id: symptomId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Symptom entry not found.");

  await db.symptomEntry.update({
    where: { id: symptomId },
    data: {
      title: requiredString(formData, "title"),
      severity: String(formData.get("severity") || "MILD") as SymptomSeverity,
      bodyArea: optionalString(formData, "bodyArea"),
      startedAt: requiredDate(formData, "startedAt"),
      duration: optionalString(formData, "duration"),
      trigger: optionalString(formData, "trigger"),
      notes: optionalString(formData, "notes"),
      resolved: formData.get("resolved") === "on",
    },
  });

  revalidatePath("/symptoms");
  revalidatePath("/dashboard");
}

export async function toggleSymptomResolved(formData: FormData) {
  const user = await requireUser();
  const symptomId = requiredString(formData, "symptomId");
  const resolved = String(formData.get("resolved") || "false") === "true";

  const existing = await db.symptomEntry.findFirst({
    where: { id: symptomId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Symptom entry not found.");

  await db.symptomEntry.update({
    where: { id: symptomId },
    data: { resolved },
  });

  revalidatePath("/symptoms");
  revalidatePath("/dashboard");
}

export async function deleteSymptom(formData: FormData) {
  const user = await requireUser();
  const symptomId = requiredString(formData, "symptomId");

  const existing = await db.symptomEntry.findFirst({
    where: { id: symptomId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Symptom entry not found.");

  await db.symptomEntry.delete({ where: { id: symptomId } });

  revalidatePath("/symptoms");
  revalidatePath("/dashboard");
}

export async function saveVaccination(formData: FormData) {
  const user = await requireUser();

  await db.vaccinationRecord.create({
    data: {
      userId: user.id,
      vaccineName: requiredString(formData, "vaccineName"),
      doseNumber: optionalInteger(formData, "doseNumber") ?? 1,
      dateTaken: requiredDate(formData, "dateTaken"),
      location: optionalString(formData, "location"),
      nextDueDate: optionalDate(formData, "nextDueDate"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/vaccinations");
  revalidatePath("/dashboard");
}

export async function updateVaccination(formData: FormData) {
  const user = await requireUser();
  const vaccinationId = requiredString(formData, "vaccinationId");

  const existing = await db.vaccinationRecord.findFirst({
    where: { id: vaccinationId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Vaccination record not found.");

  await db.vaccinationRecord.update({
    where: { id: vaccinationId },
    data: {
      vaccineName: requiredString(formData, "vaccineName"),
      doseNumber: optionalInteger(formData, "doseNumber") ?? 1,
      dateTaken: requiredDate(formData, "dateTaken"),
      location: optionalString(formData, "location"),
      nextDueDate: optionalDate(formData, "nextDueDate"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/vaccinations");
  revalidatePath("/dashboard");
}

export async function deleteVaccination(formData: FormData) {
  const user = await requireUser();
  const vaccinationId = requiredString(formData, "vaccinationId");

  const existing = await db.vaccinationRecord.findFirst({
    where: { id: vaccinationId, userId: user.id },
    select: { id: true },
  });

  if (!existing) throw new Error("Vaccination record not found.");

  await db.vaccinationRecord.delete({ where: { id: vaccinationId } });

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
      title: requiredString(formData, "title"),
      type: String(formData.get("type") || "OTHER") as DocumentType,
      notes: optionalString(formData, "notes"),
      ...upload,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}
