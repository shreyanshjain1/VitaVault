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
import { deleteUpload, saveUpload } from "@/lib/upload";
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
        create: scheduleTimes.map((time) => ({ timeOfDay: time })),
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

export async function updateDoctor(formData: FormData) {
  const user = await requireUser();
  const doctorId = String(formData.get("doctorId") || "").trim();

  if (!doctorId) {
    throw new Error("Doctor ID is required.");
  }

  await db.doctor.updateMany({
    where: { id: doctorId, userId: user.id },
    data: {
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

export async function deleteDoctor(formData: FormData) {
  const user = await requireUser();
  const doctorId = String(formData.get("doctorId") || "").trim();

  if (!doctorId) {
    throw new Error("Doctor ID is required.");
  }

  const [medicationCount, appointmentCount] = await Promise.all([
    db.medication.count({ where: { userId: user.id, doctorId } }),
    db.appointment.count({ where: { userId: user.id, doctorId } }),
  ]);

  if (medicationCount > 0 || appointmentCount > 0) {
    throw new Error(
      "This doctor is linked to existing medications or appointments. Reassign or remove those links before deleting this doctor."
    );
  }

  await db.doctor.deleteMany({ where: { id: doctorId, userId: user.id } });

  revalidatePath("/doctors");
  revalidatePath("/medications");
  revalidatePath("/appointments");
}

export async function updateAppointment(formData: FormData) {
  const user = await requireUser();
  const appointmentId = String(formData.get("appointmentId") || "").trim();

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  await db.appointment.updateMany({
    where: { id: appointmentId, userId: user.id },
    data: {
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

export async function deleteAppointment(formData: FormData) {
  const user = await requireUser();
  const appointmentId = String(formData.get("appointmentId") || "").trim();

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  await db.appointment.deleteMany({ where: { id: appointmentId, userId: user.id } });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

export async function updateLabResult(formData: FormData) {
  const user = await requireUser();
  const labResultId = String(formData.get("labResultId") || "").trim();

  if (!labResultId) {
    throw new Error("Lab result ID is required.");
  }

  await db.labResult.updateMany({
    where: { id: labResultId, userId: user.id },
    data: {
      testName: String(formData.get("testName") || "").trim(),
      dateTaken: new Date(String(formData.get("dateTaken"))),
      resultSummary: String(formData.get("resultSummary") || "").trim(),
      referenceRange: String(formData.get("referenceRange") || "").trim() || null,
      flag: String(formData.get("flag") || "NORMAL") as LabFlag,
    },
  });

  revalidatePath("/labs");
  revalidatePath("/dashboard");
}

export async function deleteLabResult(formData: FormData) {
  const user = await requireUser();
  const labResultId = String(formData.get("labResultId") || "").trim();

  if (!labResultId) {
    throw new Error("Lab result ID is required.");
  }

  const record = await db.labResult.findFirst({
    where: { id: labResultId, userId: user.id },
    select: { filePath: true },
  });

  if (!record) {
    throw new Error("Lab result not found.");
  }

  await db.labResult.delete({ where: { id: labResultId } });
  await deleteUpload(record.filePath);

  revalidatePath("/labs");
  revalidatePath("/dashboard");
}

export async function updateDocumentMetadata(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") || "").trim();

  if (!documentId) {
    throw new Error("Document ID is required.");
  }

  await db.medicalDocument.updateMany({
    where: { id: documentId, userId: user.id },
    data: {
      title: String(formData.get("title") || "").trim(),
      type: String(formData.get("type") || "OTHER") as DocumentType,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

export async function deleteDocument(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") || "").trim();

  if (!documentId) {
    throw new Error("Document ID is required.");
  }

  const document = await db.medicalDocument.findFirst({
    where: { id: documentId, userId: user.id },
    select: { filePath: true },
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  await db.medicalDocument.delete({ where: { id: documentId } });
  await deleteUpload(document.filePath);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}
