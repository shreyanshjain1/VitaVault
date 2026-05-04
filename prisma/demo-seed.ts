import {
  AlertRuleCategory,
  AlertSeverity,
  AlertSourceType,
  AlertStatus,
  AppRole,
  AppointmentStatus,
  CareAccessRole,
  CareAccessStatus,
  DeviceConnectionStatus,
  DevicePlatform,
  DeviceReadingType,
  DocumentLinkType,
  DocumentType,
  JobKind,
  JobRunStatus,
  LabFlag,
  MedicationLogStatus,
  MedicationStatus,
  PrismaClient,
  ReadingSource,
  ReminderChannel,
  ReminderSourceType,
  ReminderState,
  ReminderType,
  Sex,
  SymptomSeverity,
  SyncJobStatus,
  ThresholdOperator,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo12345";
const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function demoToken(label: string) {
  return `demo-${label}-${Math.random().toString(36).slice(2, 10)}`;
}

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

async function resetDemoAccounts() {
  const emails = [
    "admin@vitavault.demo",
    "patient@vitavault.demo",
    "caregiver@vitavault.demo",
    "doctor@vitavault.demo",
    "lab@vitavault.demo",
  ];

  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

async function main() {
  console.log("Resetting VitaVault demo data...");
  await resetDemoAccounts();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@vitavault.demo",
      name: "Avery Admin",
      role: AppRole.ADMIN,
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const patient = await prisma.user.create({
    data: {
      email: "patient@vitavault.demo",
      name: "Maya Santos",
      role: AppRole.PATIENT,
      emailVerified: new Date(),
      passwordHash,
      healthProfile: {
        create: {
          fullName: "Maya Santos",
          dateOfBirth: new Date("1991-08-17"),
          sex: Sex.FEMALE,
          bloodType: "O+",
          heightCm: 162,
          weightKg: 68.4,
          emergencyContactName: "Rafael Santos",
          emergencyContactPhone: "+63 917 204 8842",
          chronicConditions: "Hypertension, borderline fasting glucose",
          allergiesSummary: "Penicillin, shellfish",
          notes: "Prefers morning appointments. Tracks blood pressure at home with a smart BP monitor.",
        },
      },
    },
  });

  const caregiver = await prisma.user.create({
    data: {
      email: "caregiver@vitavault.demo",
      name: "Rafael Santos",
      role: AppRole.CAREGIVER,
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@vitavault.demo",
      name: "Dr. Elena Cruz",
      role: AppRole.DOCTOR,
      emailVerified: new Date(),
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      email: "lab@vitavault.demo",
      name: "NorthCare Lab Reviewer",
      role: AppRole.LAB_STAFF,
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const primaryDoctor = await prisma.doctor.create({
    data: {
      userId: patient.id,
      name: "Dr. Elena Cruz",
      specialty: "Internal Medicine",
      clinic: "NorthCare Medical Center",
      phone: "+63 917 120 4455",
      email: "elena.cruz@northcare.demo",
      address: "BGC, Taguig City",
      notes: "Primary physician monitoring BP and glucose trends.",
    },
  });

  const cardioDoctor = await prisma.doctor.create({
    data: {
      userId: patient.id,
      name: "Dr. Marco Reyes",
      specialty: "Cardiology",
      clinic: "HeartPoint Clinic",
      phone: "+63 917 555 0192",
      email: "marco.reyes@heartpoint.demo",
      address: "Makati City",
      notes: "Consulted for recurring elevated blood pressure.",
    },
  });

  const losartan = await prisma.medication.create({
    data: {
      userId: patient.id,
      doctorId: primaryDoctor.id,
      name: "Losartan",
      dosage: "50mg",
      frequency: "Twice daily",
      instructions: "Take after meals. Do not skip evening dose.",
      startDate: daysFromNow(-75),
      status: MedicationStatus.ACTIVE,
      active: true,
      schedules: { create: [{ timeOfDay: "08:00" }, { timeOfDay: "20:00" }] },
    },
  });

  const metformin = await prisma.medication.create({
    data: {
      userId: patient.id,
      doctorId: primaryDoctor.id,
      name: "Metformin",
      dosage: "500mg",
      frequency: "Once daily",
      instructions: "Take with breakfast.",
      startDate: daysFromNow(-30),
      status: MedicationStatus.ACTIVE,
      active: true,
      schedules: { create: [{ timeOfDay: "08:30" }] },
    },
  });

  await prisma.medication.create({
    data: {
      userId: patient.id,
      doctorId: cardioDoctor.id,
      name: "Amlodipine",
      dosage: "5mg",
      frequency: "Once daily",
      instructions: "Trial course completed after cardiology review.",
      startDate: daysFromNow(-120),
      endDate: daysFromNow(-25),
      status: MedicationStatus.COMPLETED,
      active: false,
    },
  });

  await prisma.medicationLog.createMany({
    data: [
      { userId: patient.id, medicationId: losartan.id, scheduleTime: "08:00", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-6), notes: "Morning dose with breakfast." },
      { userId: patient.id, medicationId: losartan.id, scheduleTime: "20:00", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-6) },
      { userId: patient.id, medicationId: metformin.id, scheduleTime: "08:30", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-5) },
      { userId: patient.id, medicationId: losartan.id, scheduleTime: "08:00", status: MedicationLogStatus.MISSED, loggedAt: daysFromNow(-4), notes: "Forgot during travel." },
      { userId: patient.id, medicationId: losartan.id, scheduleTime: "20:00", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-4) },
      { userId: patient.id, medicationId: metformin.id, scheduleTime: "08:30", status: MedicationLogStatus.SKIPPED, loggedAt: daysFromNow(-3), notes: "Skipped due to stomach upset." },
      { userId: patient.id, medicationId: losartan.id, scheduleTime: "08:00", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-2) },
      { userId: patient.id, medicationId: losartan.id, scheduleTime: "20:00", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-2) },
      { userId: patient.id, medicationId: metformin.id, scheduleTime: "08:30", status: MedicationLogStatus.TAKEN, loggedAt: daysFromNow(-1) },
    ],
  });

  await prisma.appointment.createMany({
    data: [
      {
        userId: patient.id,
        doctorId: primaryDoctor.id,
        clinic: primaryDoctor.clinic || "NorthCare Medical Center",
        specialty: primaryDoctor.specialty,
        doctorName: primaryDoctor.name,
        scheduledAt: daysFromNow(3),
        purpose: "Hypertension and glucose follow-up",
        notes: "Bring BP readings, latest labs, and medication adherence notes.",
        status: AppointmentStatus.UPCOMING,
      },
      {
        userId: patient.id,
        doctorId: cardioDoctor.id,
        clinic: cardioDoctor.clinic || "HeartPoint Clinic",
        specialty: cardioDoctor.specialty,
        doctorName: cardioDoctor.name,
        scheduledAt: daysFromNow(17),
        purpose: "Cardiology review",
        notes: "Review BP trend and wearable heart rate data.",
        status: AppointmentStatus.UPCOMING,
      },
      {
        userId: patient.id,
        doctorId: primaryDoctor.id,
        clinic: primaryDoctor.clinic || "NorthCare Medical Center",
        specialty: primaryDoctor.specialty,
        doctorName: primaryDoctor.name,
        scheduledAt: daysFromNow(-28),
        purpose: "Routine health review",
        followUpNotes: "Continue Losartan and track morning BP readings.",
        status: AppointmentStatus.COMPLETED,
      },
    ],
  });

  const fastingGlucose = await prisma.labResult.create({
    data: {
      userId: patient.id,
      testName: "Fasting Blood Sugar",
      dateTaken: daysFromNow(-5),
      resultSummary: "116 mg/dL",
      referenceRange: "70-99 mg/dL",
      flag: LabFlag.BORDERLINE,
      fileName: "demo-fasting-glucose.pdf",
      filePath: "demo/demo-fasting-glucose.pdf",
    },
  });

  const lipidProfile = await prisma.labResult.create({
    data: {
      userId: patient.id,
      testName: "Lipid Profile",
      dateTaken: daysFromNow(-18),
      resultSummary: "LDL 142 mg/dL, HDL 47 mg/dL, TG 168 mg/dL",
      referenceRange: "LDL < 100 mg/dL",
      flag: LabFlag.HIGH,
      fileName: "demo-lipid-profile.pdf",
      filePath: "demo/demo-lipid-profile.pdf",
    },
  });

  await prisma.labResult.create({
    data: {
      userId: patient.id,
      testName: "Complete Blood Count",
      dateTaken: daysFromNow(-32),
      resultSummary: "Within normal range",
      referenceRange: "Standard adult range",
      flag: LabFlag.NORMAL,
      fileName: "demo-cbc.pdf",
      filePath: "demo/demo-cbc.pdf",
    },
  });

  await prisma.vitalRecord.createMany({
    data: [
      { userId: patient.id, recordedAt: daysFromNow(-10), systolic: 142, diastolic: 91, heartRate: 82, bloodSugar: 118, oxygenSaturation: 98, temperatureC: 36.7, weightKg: 69.1, notes: "Evening reading after stressful day." },
      { userId: patient.id, recordedAt: daysFromNow(-8), systolic: 136, diastolic: 86, heartRate: 78, bloodSugar: 111, oxygenSaturation: 98, temperatureC: 36.6, weightKg: 68.9 },
      { userId: patient.id, recordedAt: daysFromNow(-6), systolic: 132, diastolic: 84, heartRate: 76, bloodSugar: 108, oxygenSaturation: 99, temperatureC: 36.5, weightKg: 68.8 },
      { userId: patient.id, recordedAt: daysFromNow(-4), systolic: 145, diastolic: 92, heartRate: 84, bloodSugar: 120, oxygenSaturation: 97, temperatureC: 36.8, weightKg: 68.6, notes: "Smart BP alert triggered." },
      { userId: patient.id, recordedAt: daysFromNow(-2), systolic: 130, diastolic: 82, heartRate: 74, bloodSugar: 106, oxygenSaturation: 99, temperatureC: 36.4, weightKg: 68.4 },
      { userId: patient.id, recordedAt: hoursFromNow(-8), systolic: 128, diastolic: 80, heartRate: 72, bloodSugar: 102, oxygenSaturation: 99, temperatureC: 36.5, weightKg: 68.3 },
    ],
  });

  const headache = await prisma.symptomEntry.create({
    data: {
      userId: patient.id,
      title: "Recurring headache",
      severity: SymptomSeverity.MODERATE,
      bodyArea: "Head",
      startedAt: hoursFromNow(-26),
      duration: "Intermittent, 1-2 hours",
      trigger: "Stress and poor sleep",
      notes: "Usually improves with hydration and rest.",
      resolved: false,
    },
  });

  await prisma.symptomEntry.createMany({
    data: [
      { userId: patient.id, title: "Dizziness on standing", severity: SymptomSeverity.SEVERE, bodyArea: "General", startedAt: daysFromNow(-3), duration: "10 minutes", trigger: "Standing quickly", notes: "Occurred after missed morning dose.", resolved: false },
      { userId: patient.id, title: "Seasonal sneezing", severity: SymptomSeverity.MILD, bodyArea: "Nose", startedAt: daysFromNow(-9), duration: "On and off", trigger: "Dust exposure", notes: "Likely allergy flare.", resolved: true },
      { userId: patient.id, title: "Mild fatigue", severity: SymptomSeverity.MILD, bodyArea: "General", startedAt: daysFromNow(-1), duration: "Afternoon", trigger: "Low sleep", notes: null, resolved: false },
    ],
  });

  await prisma.vaccinationRecord.createMany({
    data: [
      { userId: patient.id, vaccineName: "Influenza Vaccine", doseNumber: 1, dateTaken: daysFromNow(-120), location: "NorthCare Medical Center", nextDueDate: daysFromNow(245), notes: "Annual vaccination." },
      { userId: patient.id, vaccineName: "COVID-19 Booster", doseNumber: 3, dateTaken: daysFromNow(-300), location: "Community Health Center", nextDueDate: daysFromNow(60), notes: "Booster review due soon." },
    ],
  });

  await prisma.medicalDocument.createMany({
    data: [
      {
        userId: patient.id,
        title: "Fasting Glucose Lab Report",
        type: DocumentType.LAB_RESULT,
        filePath: "demo/demo-fasting-glucose.pdf",
        fileName: "demo-fasting-glucose.pdf",
        mimeType: "application/pdf",
        sizeBytes: 248120,
        notes: "Linked to the latest fasting glucose result.",
        linkedRecordType: DocumentLinkType.LAB_RESULT,
        linkedRecordId: fastingGlucose.id,
      },
      {
        userId: patient.id,
        title: "Lipid Profile Report",
        type: DocumentType.LAB_RESULT,
        filePath: "demo/demo-lipid-profile.pdf",
        fileName: "demo-lipid-profile.pdf",
        mimeType: "application/pdf",
        sizeBytes: 289410,
        notes: "Review LDL trend during doctor visit.",
        linkedRecordType: DocumentLinkType.LAB_RESULT,
        linkedRecordId: lipidProfile.id,
      },
      {
        userId: patient.id,
        title: "Losartan Prescription",
        type: DocumentType.PRESCRIPTION,
        filePath: "demo/demo-losartan-prescription.pdf",
        fileName: "demo-losartan-prescription.pdf",
        mimeType: "application/pdf",
        sizeBytes: 198420,
        notes: "Prescription from internal medicine follow-up.",
      },
      {
        userId: patient.id,
        title: "Cardiology Referral Note",
        type: DocumentType.CERTIFICATE,
        filePath: "demo/demo-cardiology-referral.pdf",
        fileName: "demo-cardiology-referral.pdf",
        mimeType: "application/pdf",
        sizeBytes: 165200,
        notes: null,
      },
    ],
  });

  await prisma.reminder.createMany({
    data: [
      { userId: patient.id, type: ReminderType.MEDICATION, title: "Take Losartan", description: "Evening dose", dueAt: hoursFromNow(4), state: ReminderState.DUE, channel: ReminderChannel.IN_APP, sourceType: ReminderSourceType.MEDICATION_SCHEDULE, sourceId: losartan.id, timezone: "Asia/Manila" },
      { userId: patient.id, type: ReminderType.MEDICATION, title: "Take Metformin", description: "Morning dose with breakfast", dueAt: hoursFromNow(17), state: ReminderState.DUE, channel: ReminderChannel.IN_APP, sourceType: ReminderSourceType.MEDICATION_SCHEDULE, sourceId: metformin.id, timezone: "Asia/Manila" },
      { userId: patient.id, type: ReminderType.APPOINTMENT, title: "Prepare for hypertension follow-up", description: "Review visit prep packet before appointment", dueAt: daysFromNow(2), state: ReminderState.DUE, channel: ReminderChannel.EMAIL, sourceType: ReminderSourceType.APPOINTMENT, timezone: "Asia/Manila" },
      { userId: patient.id, type: ReminderType.LAB_FOLLOW_UP, title: "Review lipid profile", description: "LDL is high and should be discussed", dueAt: daysFromNow(-1), state: ReminderState.OVERDUE, channel: ReminderChannel.IN_APP, sourceType: ReminderSourceType.LAB_FOLLOW_UP, sourceId: lipidProfile.id, timezone: "Asia/Manila" },
    ],
  });

  const bpRule = await prisma.alertRule.create({
    data: {
      userId: patient.id,
      name: "Elevated blood pressure",
      description: "Flags systolic readings above 140 or diastolic above 90.",
      category: AlertRuleCategory.VITAL_THRESHOLD,
      metricKey: "blood_pressure",
      sourceType: AlertSourceType.VITAL_RECORD,
      enabled: true,
      severity: AlertSeverity.HIGH,
      thresholdOperator: ThresholdOperator.GT,
      thresholdValue: 140,
      thresholdValueSecondary: 90,
      visibleToCareTeam: true,
      metadataJson: json({ reviewerNote: "Demo threshold used by Vitals Monitor and Notification Center." }),
    },
  });

  const symptomRule = await prisma.alertRule.create({
    data: {
      userId: patient.id,
      name: "Severe symptom follow-up",
      description: "Flags severe unresolved symptoms for care-team visibility.",
      category: AlertRuleCategory.SYMPTOM_SEVERITY,
      sourceType: AlertSourceType.SYMPTOM_ENTRY,
      sourceId: headache.id,
      enabled: true,
      severity: AlertSeverity.CRITICAL,
      symptomSeverity: SymptomSeverity.SEVERE,
      visibleToCareTeam: true,
    },
  });

  const bpAlert = await prisma.alertEvent.create({
    data: {
      userId: patient.id,
      ruleId: bpRule.id,
      title: "Blood pressure needs review",
      message: "Recent home BP readings crossed the configured high threshold.",
      category: AlertRuleCategory.VITAL_THRESHOLD,
      severity: AlertSeverity.HIGH,
      status: AlertStatus.OPEN,
      visibleToCareTeam: true,
      sourceType: AlertSourceType.VITAL_RECORD,
      sourceRecordedAt: daysFromNow(-4),
      contextJson: json({ systolic: 145, diastolic: 92, recommendation: "Discuss trend with provider." }),
    },
  });

  const symptomAlert = await prisma.alertEvent.create({
    data: {
      userId: patient.id,
      ruleId: symptomRule.id,
      title: "Severe dizziness remains unresolved",
      message: "A severe symptom remains open and should be reviewed before the next appointment.",
      category: AlertRuleCategory.SYMPTOM_SEVERITY,
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.ACKNOWLEDGED,
      visibleToCareTeam: true,
      sourceType: AlertSourceType.SYMPTOM_ENTRY,
      sourceRecordedAt: daysFromNow(-3),
      contextJson: json({ bodyArea: "General", trigger: "Standing quickly" }),
    },
  });

  await prisma.alertAuditLog.createMany({
    data: [
      { userId: patient.id, alertId: bpAlert.id, ruleId: bpRule.id, actorUserId: admin.id, action: "CREATED", note: "Demo seed generated elevated BP alert." },
      { userId: patient.id, alertId: symptomAlert.id, ruleId: symptomRule.id, actorUserId: caregiver.id, action: "ACKNOWLEDGED", note: "Caregiver acknowledged severe dizziness signal." },
    ],
  });

  const connection = await prisma.deviceConnection.create({
    data: {
      userId: patient.id,
      source: ReadingSource.SMART_BP_MONITOR,
      platform: DevicePlatform.OTHER,
      clientDeviceId: "demo-smart-bp-monitor-001",
      deviceLabel: "Demo Smart BP Monitor",
      appVersion: "1.0-demo",
      status: DeviceConnectionStatus.ACTIVE,
      scopesJson: json(["blood_pressure", "heart_rate"]),
      lastSyncedAt: hoursFromNow(-8),
    },
  });

  const syncJob = await prisma.syncJob.create({
    data: {
      userId: patient.id,
      connectionId: connection.id,
      source: ReadingSource.SMART_BP_MONITOR,
      platform: DevicePlatform.OTHER,
      status: SyncJobStatus.SUCCEEDED,
      requestedCount: 3,
      acceptedCount: 3,
      mirroredCount: 2,
      startedAt: hoursFromNow(-8),
      finishedAt: hoursFromNow(-8),
      metadataJson: json({ source: "demo-seed", note: "Device Sync Simulator sample history." }),
    },
  });

  const jobRun = await prisma.jobRun.create({
    data: {
      queueName: "device-sync",
      jobName: "Demo Smart BP Monitor Sync",
      jobKind: JobKind.DEVICE_SYNC_PROCESSING,
      status: JobRunStatus.COMPLETED,
      userId: patient.id,
      connectionId: connection.id,
      syncJobId: syncJob.id,
      inputJson: json({ provider: "SMART_BP_MONITOR", requestedCount: 3 }),
      resultJson: json({ acceptedCount: 3, mirroredCount: 2 }),
      attemptsMade: 1,
      maxAttempts: 3,
      startedAt: hoursFromNow(-8),
      finishedAt: hoursFromNow(-8),
    },
  });

  await prisma.jobRunLog.createMany({
    data: [
      { jobRunId: jobRun.id, level: "info", message: "Demo sync job started", contextJson: json({ source: "demo-seed" }) },
      { jobRunId: jobRun.id, level: "info", message: "Accepted 3 readings and mirrored 2 vitals", contextJson: json({ mirrored: ["BLOOD_PRESSURE", "HEART_RATE"] }) },
    ],
  });

  await prisma.deviceReading.createMany({
    data: [
      { userId: patient.id, connectionId: connection.id, source: ReadingSource.SMART_BP_MONITOR, platform: DevicePlatform.OTHER, readingType: DeviceReadingType.BLOOD_PRESSURE, capturedAt: daysFromNow(-4), dedupeKey: demoToken("bp-reading-1"), unit: "mmHg", systolic: 145, diastolic: 92, metadataJson: json({ mirrored: true }) },
      { userId: patient.id, connectionId: connection.id, source: ReadingSource.SMART_BP_MONITOR, platform: DevicePlatform.OTHER, readingType: DeviceReadingType.BLOOD_PRESSURE, capturedAt: hoursFromNow(-8), dedupeKey: demoToken("bp-reading-2"), unit: "mmHg", systolic: 128, diastolic: 80, metadataJson: json({ mirrored: true }) },
      { userId: patient.id, connectionId: connection.id, source: ReadingSource.SMART_BP_MONITOR, platform: DevicePlatform.OTHER, readingType: DeviceReadingType.HEART_RATE, capturedAt: hoursFromNow(-8), dedupeKey: demoToken("hr-reading-1"), unit: "bpm", valueInt: 72, metadataJson: json({ mirrored: true }) },
    ],
  });

  await prisma.careAccess.create({
    data: {
      ownerUserId: patient.id,
      memberUserId: caregiver.id,
      accessRole: CareAccessRole.CAREGIVER,
      status: CareAccessStatus.ACTIVE,
      canViewRecords: true,
      canEditRecords: false,
      canAddNotes: true,
      canExport: true,
      canGenerateAIInsights: true,
      grantedByUserId: patient.id,
      note: "Demo caregiver can view records, add notes, export packets, and generate AI insights.",
    },
  });

  await prisma.careAccess.create({
    data: {
      ownerUserId: patient.id,
      memberUserId: doctorUser.id,
      accessRole: CareAccessRole.DOCTOR,
      status: CareAccessStatus.ACTIVE,
      canViewRecords: true,
      canEditRecords: false,
      canAddNotes: true,
      canExport: true,
      canGenerateAIInsights: true,
      grantedByUserId: patient.id,
      note: "Demo provider workspace access.",
    },
  });

  await prisma.careInvite.create({
    data: {
      ownerUserId: patient.id,
      email: "nutritionist@vitavault.demo",
      accessRole: CareAccessRole.VIEWER,
      status: CareAccessStatus.PENDING,
      token: demoToken("nutritionist-invite"),
      grantedByUserId: patient.id,
      canViewRecords: true,
      canEditRecords: false,
      canAddNotes: false,
      canExport: false,
      canGenerateAIInsights: false,
      note: "Pending nutritionist viewer invite for demo care-team queue.",
      expiresAt: daysFromNow(7),
    },
  });

  await prisma.accessAuditLog.createMany({
    data: [
      { ownerUserId: patient.id, actorUserId: patient.id, action: "CARE_ACCESS_GRANTED", targetType: "USER", targetId: caregiver.id, metadataJson: json({ role: "CAREGIVER" }) },
      { ownerUserId: patient.id, actorUserId: patient.id, action: "CARE_ACCESS_GRANTED", targetType: "USER", targetId: doctorUser.id, metadataJson: json({ role: "DOCTOR" }) },
      { ownerUserId: patient.id, actorUserId: admin.id, action: "DEMO_DATA_SEEDED", targetType: "USER", targetId: patient.id, metadataJson: json({ seed: "prisma/demo-seed.ts" }) },
    ],
  });

  await prisma.aiInsight.create({
    data: {
      ownerUserId: patient.id,
      generatedByUserId: caregiver.id,
      title: "Demo care-risk overview",
      summary: "Maya has improving blood-pressure trend overall, but one high BP reading, a missed Losartan dose, and unresolved dizziness should be reviewed before the next appointment.",
      adherenceRisk: "MEDIUM",
      trendFlagsJson: json(["Elevated BP reading on recent smart monitor sync", "Borderline fasting glucose", "One missed Losartan dose in the recent log"]),
      suggestedQuestionsJson: json(["Should medication timing be adjusted?", "Should glucose monitoring frequency increase?", "Should dizziness trigger orthostatic BP checks?"]),
      recommendedFollowUpJson: json(["Bring BP readings to appointment", "Review lipid profile result", "Resolve severe dizziness entry or escalate if recurrent"]),
      disclaimer: "Demo AI insight generated from seeded data. Not medical advice.",
    },
  });

  await prisma.reminderAuditLog.create({
    data: {
      userId: patient.id,
      actorUserId: caregiver.id,
      action: "DEMO_REVIEWED",
      note: "Caregiver reviewed medication and appointment reminders in seeded demo workspace.",
      metadataJson: json({ channel: "IN_APP", seed: true }),
    },
  });

  console.log("VitaVault demo data seeded successfully.");
  console.log("Demo accounts:");
  console.log(`- admin@vitavault.demo / ${DEMO_PASSWORD}`);
  console.log(`- patient@vitavault.demo / ${DEMO_PASSWORD}`);
  console.log(`- caregiver@vitavault.demo / ${DEMO_PASSWORD}`);
  console.log(`- doctor@vitavault.demo / ${DEMO_PASSWORD}`);
  console.log(`- lab@vitavault.demo / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed VitaVault demo data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
