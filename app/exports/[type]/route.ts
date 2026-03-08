import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/export";
import { formatDate, formatDateTime, bpLabel } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const user = await requireUser();
  const { type } = await params;
  let filename = "export.csv";
  let rows: Record<string, unknown>[] = [];

  if (type === "appointments") {
    const items = await db.appointment.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: "desc" } });
    rows = items.map(item => ({ Clinic: item.clinic, Specialty: item.specialty, Doctor: item.doctorName, DateTime: formatDateTime(item.scheduledAt), Purpose: item.purpose, Status: item.status }));
    filename = "appointments.csv";
  } else if (type === "medications") {
    const items = await db.medication.findMany({ where: { userId: user.id }, include: { schedules: true }, orderBy: { createdAt: "desc" } });
    rows = items.map(item => ({ Name: item.name, Dosage: item.dosage, Frequency: item.frequency, Times: item.schedules.map(s => s.timeOfDay).join(", "), StartDate: formatDate(item.startDate), EndDate: formatDate(item.endDate), Status: item.status }));
    filename = "medications.csv";
  } else if (type === "labs") {
    const items = await db.labResult.findMany({ where: { userId: user.id }, orderBy: { dateTaken: "desc" } });
    rows = items.map(item => ({ TestName: item.testName, DateTaken: formatDate(item.dateTaken), ResultSummary: item.resultSummary, ReferenceRange: item.referenceRange, Flag: item.flag }));
    filename = "lab-results.csv";
  } else if (type === "vitals") {
    const items = await db.vitalRecord.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "desc" } });
    rows = items.map(item => ({ RecordedAt: formatDateTime(item.recordedAt), BloodPressure: bpLabel(item.systolic, item.diastolic), HeartRate: item.heartRate, BloodSugar: item.bloodSugar, OxygenSaturation: item.oxygenSaturation, TemperatureC: item.temperatureC, WeightKg: item.weightKg }));
    filename = "vitals.csv";
  }
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${filename}"` } });
}
