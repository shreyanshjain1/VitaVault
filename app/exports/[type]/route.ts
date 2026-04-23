import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/export";
import { formatDate, formatDateTime, bpLabel, formatBytes } from "@/lib/utils";
import { exportDefinitionMap } from "@/lib/export-definitions";

function csvResponse(type: string, rows: Record<string, unknown>[]) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${type}-${timestamp}.csv`;

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const user = await requireUser();
  const { type } = await params;

  if (!exportDefinitionMap.has(type)) {
    return NextResponse.json({ error: "Unknown export type." }, { status: 404 });
  }

  let rows: Record<string, unknown>[] = [];

  switch (type) {
    case "appointments": {
      const items = await db.appointment.findMany({
        where: { userId: user.id },
        orderBy: { scheduledAt: "desc" },
      });
      rows = items.map((item) => ({
        Clinic: item.clinic,
        Specialty: item.specialty,
        Doctor: item.doctorName,
        DateTime: formatDateTime(item.scheduledAt),
        Purpose: item.purpose,
        Notes: item.notes,
        FollowUpNotes: item.followUpNotes,
        Status: item.status,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "medications": {
      const items = await db.medication.findMany({
        where: { userId: user.id },
        include: { schedules: true, doctor: true },
        orderBy: { createdAt: "desc" },
      });
      rows = items.map((item) => ({
        Name: item.name,
        Dosage: item.dosage,
        Frequency: item.frequency,
        Instructions: item.instructions,
        Times: item.schedules.map((schedule) => schedule.timeOfDay).join(", "),
        StartDate: formatDate(item.startDate),
        EndDate: formatDate(item.endDate),
        Status: item.status,
        Active: item.active ? "Yes" : "No",
        Doctor: item.doctor?.name,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "labs": {
      const items = await db.labResult.findMany({
        where: { userId: user.id },
        orderBy: { dateTaken: "desc" },
      });
      rows = items.map((item) => ({
        TestName: item.testName,
        DateTaken: formatDate(item.dateTaken),
        ResultSummary: item.resultSummary,
        ReferenceRange: item.referenceRange,
        Flag: item.flag,
        FileName: item.fileName,
        FilePath: item.filePath,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "vitals": {
      const items = await db.vitalRecord.findMany({
        where: { userId: user.id },
        orderBy: { recordedAt: "desc" },
      });
      rows = items.map((item) => ({
        RecordedAt: formatDateTime(item.recordedAt),
        BloodPressure: bpLabel(item.systolic, item.diastolic),
        HeartRate: item.heartRate,
        BloodSugar: item.bloodSugar,
        OxygenSaturation: item.oxygenSaturation,
        TemperatureC: item.temperatureC,
        WeightKg: item.weightKg,
        ReadingSource: item.readingSource,
        Notes: item.notes,
      }));
      break;
    }
    case "symptoms": {
      const items = await db.symptomEntry.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: "desc" },
      });
      rows = items.map((item) => ({
        Title: item.title,
        Severity: item.severity,
        BodyArea: item.bodyArea,
        StartedAt: formatDateTime(item.startedAt),
        Duration: item.duration,
        Trigger: item.trigger,
        Resolved: item.resolved ? "Yes" : "No",
        Notes: item.notes,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "vaccinations": {
      const items = await db.vaccinationRecord.findMany({
        where: { userId: user.id },
        orderBy: { dateTaken: "desc" },
      });
      rows = items.map((item) => ({
        VaccineName: item.vaccineName,
        DoseNumber: item.doseNumber,
        DateTaken: formatDate(item.dateTaken),
        Location: item.location,
        NextDueDate: formatDate(item.nextDueDate),
        Notes: item.notes,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "reminders": {
      const items = await db.reminder.findMany({
        where: { userId: user.id },
        orderBy: { dueAt: "desc" },
      });
      rows = items.map((item) => ({
        Title: item.title,
        Type: item.type,
        Description: item.description,
        DueAt: formatDateTime(item.dueAt),
        State: item.state,
        Completed: item.completed ? "Yes" : "No",
        Channel: item.channel,
        SourceType: item.sourceType,
        SourceId: item.sourceId,
        SentAt: formatDateTime(item.sentAt),
        OverdueAt: formatDateTime(item.overdueAt),
        CompletedAt: formatDateTime(item.completedAt),
        SkippedAt: formatDateTime(item.skippedAt),
        MissedAt: formatDateTime(item.missedAt),
        Timezone: item.timezone,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "documents": {
      const items = await db.medicalDocument.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      rows = items.map((item) => ({
        Title: item.title,
        Type: item.type,
        FileName: item.fileName,
        MimeType: item.mimeType,
        SizeBytes: item.sizeBytes,
        SizeLabel: formatBytes(item.sizeBytes),
        FilePath: item.filePath,
        Notes: item.notes,
        CreatedAt: formatDateTime(item.createdAt),
      }));
      break;
    }
    case "alerts": {
      const items = await db.alertEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      rows = items.map((item) => ({
        Title: item.title,
        Message: item.message,
        Category: item.category,
        Severity: item.severity,
        Status: item.status,
        VisibleToCareTeam: item.visibleToCareTeam ? "Yes" : "No",
        SourceType: item.sourceType,
        SourceId: item.sourceId,
        SourceRecordedAt: formatDateTime(item.sourceRecordedAt),
        OwnerAcknowledgedAt: formatDateTime(item.ownerAcknowledgedAt),
        ResolvedAt: formatDateTime(item.resolvedAt),
        DismissedAt: formatDateTime(item.dismissedAt),
        CreatedAt: formatDateTime(item.createdAt),
        UpdatedAt: formatDateTime(item.updatedAt),
      }));
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown export type." }, { status: 404 });
  }

  return csvResponse(type, rows);
}
