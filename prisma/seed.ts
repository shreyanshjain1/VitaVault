import { PrismaClient, AppointmentStatus, DocumentType, LabFlag, MedicationLogStatus, MedicationStatus, ReminderType, Sex, SymptomSeverity } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "demo@health.local";
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return;

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo Patient",
      passwordHash: await bcrypt.hash("demo12345", 12),
      healthProfile: {
        create: {
          fullName: "Demo Patient",
          dateOfBirth: new Date("1992-04-14"),
          sex: Sex.MALE,
          bloodType: "O+",
          heightCm: 175,
          weightKg: 78.5,
          emergencyContactName: "Maria Patient",
          emergencyContactPhone: "+63 912 345 6789",
          chronicConditions: "Hypertension",
          allergiesSummary: "Penicillin, peanuts",
          notes: "Bring BP readings to follow-up visits."
        }
      }
    }
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      name: "Dr. Angela Cruz",
      specialty: "Internal Medicine",
      clinic: "WellPoint Medical Center",
      phone: "+63 917 111 2222",
      email: "angela.cruz@example.com",
      address: "Makati City"
    }
  });

  const medication = await prisma.medication.create({
    data: {
      userId: user.id,
      doctorId: doctor.id,
      name: "Losartan",
      dosage: "50mg",
      frequency: "Twice daily",
      instructions: "Take after meals",
      startDate: new Date(),
      status: MedicationStatus.ACTIVE,
      schedules: { create: [{ timeOfDay: "08:00" }, { timeOfDay: "20:00" }] }
    }
  });

  await prisma.medicationLog.createMany({
    data: [
      { userId: user.id, medicationId: medication.id, scheduleTime: "08:00", status: MedicationLogStatus.TAKEN, loggedAt: new Date(Date.now()-86400000*2) },
      { userId: user.id, medicationId: medication.id, scheduleTime: "20:00", status: MedicationLogStatus.TAKEN, loggedAt: new Date(Date.now()-86400000*2) },
      { userId: user.id, medicationId: medication.id, scheduleTime: "08:00", status: MedicationLogStatus.MISSED, loggedAt: new Date(Date.now()-86400000) },
      { userId: user.id, medicationId: medication.id, scheduleTime: "20:00", status: MedicationLogStatus.TAKEN, loggedAt: new Date(Date.now()-86400000) }
    ]
  });

  await prisma.appointment.createMany({
    data: [
      { userId: user.id, doctorId: doctor.id, clinic: doctor.clinic!, specialty: doctor.specialty, doctorName: doctor.name, scheduledAt: new Date(Date.now()+86400000*2), purpose: "Hypertension follow-up", notes: "Bring 2 weeks BP log", status: AppointmentStatus.UPCOMING },
      { userId: user.id, doctorId: doctor.id, clinic: doctor.clinic!, specialty: doctor.specialty, doctorName: doctor.name, scheduledAt: new Date(Date.now()-86400000*15), purpose: "Routine checkup", followUpNotes: "Continue meds and monitor BP", status: AppointmentStatus.COMPLETED }
    ]
  });

  await prisma.labResult.createMany({
    data: [
      { userId: user.id, testName: "Fasting Blood Sugar", dateTaken: new Date(Date.now()-86400000*3), resultSummary: "112 mg/dL", referenceRange: "70-99 mg/dL", flag: LabFlag.BORDERLINE },
      { userId: user.id, testName: "Lipid Profile", dateTaken: new Date(Date.now()-86400000*12), resultSummary: "LDL slightly elevated", referenceRange: "LDL < 100 mg/dL", flag: LabFlag.HIGH }
    ]
  });

  await prisma.vitalRecord.createMany({
    data: [
      { userId: user.id, recordedAt: new Date(Date.now()-86400000*6), systolic: 138, diastolic: 86, heartRate: 78, bloodSugar: 110, oxygenSaturation: 98, temperatureC: 36.6, weightKg: 79.4 },
      { userId: user.id, recordedAt: new Date(Date.now()-86400000*5), systolic: 136, diastolic: 84, heartRate: 75, bloodSugar: 108, oxygenSaturation: 98, temperatureC: 36.5, weightKg: 79.1 },
      { userId: user.id, recordedAt: new Date(Date.now()-86400000*4), systolic: 132, diastolic: 82, heartRate: 74, bloodSugar: 107, oxygenSaturation: 99, temperatureC: 36.7, weightKg: 78.9 },
      { userId: user.id, recordedAt: new Date(Date.now()-86400000*3), systolic: 130, diastolic: 80, heartRate: 73, bloodSugar: 105, oxygenSaturation: 99, temperatureC: 36.6, weightKg: 78.8 },
      { userId: user.id, recordedAt: new Date(Date.now()-86400000*2), systolic: 128, diastolic: 80, heartRate: 72, bloodSugar: 103, oxygenSaturation: 99, temperatureC: 36.5, weightKg: 78.6 }
    ]
  });

  await prisma.symptomEntry.createMany({
    data: [
      { userId: user.id, title: "Headache", severity: SymptomSeverity.MODERATE, bodyArea: "Head", startedAt: new Date(Date.now()-1000*60*60*5), duration: "2 hours", trigger: "Stress", notes: "Improved after rest", resolved: true },
      { userId: user.id, title: "Sneezing", severity: SymptomSeverity.MILD, bodyArea: "Nose", startedAt: new Date(Date.now()-1000*60*60*20), duration: "Intermittent", trigger: "Dust exposure", notes: "Possible seasonal allergy", resolved: false }
    ]
  });

  await prisma.vaccinationRecord.create({
    data: { userId: user.id, vaccineName: "Influenza Vaccine", doseNumber: 1, dateTaken: new Date("2025-10-12"), location: "WellPoint Medical Center", nextDueDate: new Date("2026-10-12"), notes: "Annual dose" }
  });

  await prisma.medicalDocument.create({
    data: {
      userId: user.id,
      title: "Initial Prescription",
      type: DocumentType.PRESCRIPTION,
      filePath: "/uploads/demo-prescription.pdf",
      fileName: "demo-prescription.pdf",
      mimeType: "application/pdf",
      sizeBytes: 218420
    }
  });

  await prisma.reminder.createMany({
    data: [
      { userId: user.id, type: ReminderType.MEDICATION, title: "Take Losartan", description: "Evening dose", dueAt: new Date(Date.now()+1000*60*60*3) },
      { userId: user.id, type: ReminderType.APPOINTMENT, title: "Hypertension follow-up", description: "Visit with Dr. Angela Cruz", dueAt: new Date(Date.now()+86400000*2) }
    ]
  });
}
main().finally(async()=>prisma.$disconnect());
