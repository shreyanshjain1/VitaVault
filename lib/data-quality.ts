import { AlertSeverity, AlertStatus, CareAccessStatus, CareNotePriority, DeviceConnectionStatus, LabFlag, MedicationLogStatus, MedicationStatus, ReminderState, SymptomSeverity, SyncJobStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type DataQualityTone = "success" | "info" | "warning" | "danger";
export type DataQualitySeverity = "healthy" | "info" | "warning" | "critical";
export type DataQualityCategory = "profile" | "records" | "safety" | "devices" | "reports" | "collaboration";
export type DataQualityItem = { id: string; title: string; description: string; category: DataQualityCategory; severity: DataQualitySeverity; href: string; action: string; evidence: string };
export type DataQualityMetric = { label: string; value: string | number; description: string; tone: DataQualityTone };
export type DataQualitySection = { id: DataQualityCategory; title: string; description: string; score: number; tone: DataQualityTone; metrics: DataQualityMetric[]; items: DataQualityItem[] };
export type DataQualityCenterData = { summary: { score: number; readinessLabel: string; criticalItems: number; warningItems: number; generatedAt: Date }; sections: DataQualitySection[]; topActions: DataQualityItem[] };

type ProfileSnapshot = { fullName?: string | null; dateOfBirth?: Date | null; sex?: unknown | null; bloodType?: string | null; heightCm?: number | null; weightKg?: number | null; emergencyContactName?: string | null; emergencyContactPhone?: string | null; chronicConditions?: string | null; allergiesSummary?: string | null };
export type DataQualityInput = { now?: Date; profile: ProfileSnapshot | null; activeMedications: number; medicationsWithoutSchedules: number; medicationLogs30d: number; missedMedicationLogs30d: number; appointments: number; upcomingAppointments: number; doctors: number; labs: number; abnormalLabs: number; latestLabDate: Date | null; vitals: number; latestVitalDate: Date | null; symptoms: number; severeOpenSymptoms: number; vaccinations: number; overdueReminders: number; openAlerts: number; highRiskAlerts: number; documents: number; linkedDocuments: number; careTeamMembers: number; activeCareNotes: number; urgentCareNotes: number; activeDeviceConnections: number; staleDeviceConnections: number; errorDeviceConnections: number; recentDeviceReadings: number; failedSyncJobs: number };

const profileFields: Array<{ key: keyof ProfileSnapshot; label: string }> = [
  { key: "fullName", label: "full name" }, { key: "dateOfBirth", label: "date of birth" }, { key: "sex", label: "sex" }, { key: "bloodType", label: "blood type" }, { key: "heightCm", label: "height" }, { key: "weightKg", label: "weight" }, { key: "emergencyContactName", label: "emergency contact name" }, { key: "emergencyContactPhone", label: "emergency contact phone" }, { key: "chronicConditions", label: "chronic conditions" }, { key: "allergiesSummary", label: "allergies" },
];

const filled = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== "";
const pct = (value: number, total: number) => (total <= 0 ? 0 : Math.round((value / total) * 100));
const daysSince = (now: Date, value: Date | null) => (value ? Math.max(0, Math.floor((now.getTime() - value.getTime()) / 86_400_000)) : null);
const ageLabel = (now: Date, value: Date | null) => { const days = daysSince(now, value); if (days === null) return "No record yet"; if (days === 0) return "today"; if (days === 1) return "1 day ago"; return `${days} days ago`; };
const toneFromScore = (score: number): DataQualityTone => score >= 85 ? "success" : score >= 70 ? "info" : score >= 45 ? "warning" : "danger";
const labelFromScore = (score: number) => score >= 85 ? "Handoff ready" : score >= 70 ? "Mostly ready" : score >= 45 ? "Needs cleanup" : "High cleanup priority";

function scoreSection(checks: boolean[], items: DataQualityItem[]) {
  const base = pct(checks.filter(Boolean).length, checks.length || 1);
  const penalty = items.reduce((sum, item) => sum + (item.severity === "critical" ? 18 : item.severity === "warning" ? 10 : item.severity === "info" ? 4 : 0), 0);
  return Math.max(0, Math.min(100, base - penalty));
}

function section(id: DataQualityCategory, title: string, description: string, checks: boolean[], metrics: DataQualityMetric[], items: DataQualityItem[]): DataQualitySection {
  const score = scoreSection(checks, items);
  return { id, title, description, score, tone: toneFromScore(score), metrics, items };
}

function push(items: DataQualityItem[], item: DataQualityItem) { items.push(item); }

export function buildDataQualityCenterData(input: DataQualityInput): DataQualityCenterData {
  const now = input.now ?? new Date();
  const items: DataQualityItem[] = [];
  const profileCompleted = input.profile ? profileFields.filter((field) => filled(input.profile?.[field.key])).length : 0;
  const missingProfile = input.profile ? profileFields.filter((field) => !filled(input.profile?.[field.key])).map((field) => field.label) : profileFields.map((field) => field.label);
  const profileCompletion = pct(profileCompleted, profileFields.length);
  const emergencyReady = Boolean(input.profile?.emergencyContactName && input.profile?.emergencyContactPhone);
  const latestVitalAge = daysSince(now, input.latestVitalDate);
  const latestLabAge = daysSince(now, input.latestLabDate);
  const documentLinkRate = pct(input.linkedDocuments, input.documents);

  if (!input.profile) push(items, { id: "profile-missing", title: "Create the health profile baseline", description: "No profile record exists yet, so handoff packets and emergency views do not have a reliable patient baseline.", category: "profile", severity: "critical", href: "/onboarding", action: "Complete onboarding", evidence: "0 profile fields available" });
  else if (profileCompletion < 80) push(items, { id: "profile-incomplete", title: "Complete missing profile fields", description: `Missing: ${missingProfile.slice(0, 5).join(", ")}${missingProfile.length > 5 ? ", and more" : ""}.`, category: "profile", severity: profileCompletion < 50 ? "critical" : "warning", href: "/health-profile", action: "Update profile", evidence: `${profileCompletion}% profile completion` });
  if (!emergencyReady) push(items, { id: "emergency-contact-missing", title: "Add emergency contact details", description: "Emergency card and patient summary packets need a reliable contact before sharing.", category: "profile", severity: "critical", href: "/health-profile", action: "Add emergency contact", evidence: "Emergency contact name or phone is missing" });
  if (input.activeMedications === 0) push(items, { id: "medications-empty", title: "Add active medication records", description: "Medication safety, emergency card, and provider packets are weaker without an active medication list.", category: "records", severity: "warning", href: "/medications", action: "Add medication", evidence: "0 active medications" });
  if (input.medicationsWithoutSchedules > 0) push(items, { id: "medications-without-schedules", title: "Add schedules to active medications", description: "Scheduled medications improve adherence tracking, reminders, and visit-prep readiness.", category: "records", severity: "warning", href: "/medications", action: "Update medication schedules", evidence: `${input.medicationsWithoutSchedules} active medication${input.medicationsWithoutSchedules === 1 ? "" : "s"} without schedules` });
  if (input.activeMedications > 0 && input.medicationLogs30d === 0) push(items, { id: "medication-logs-empty", title: "Start logging medication adherence", description: "No recent medication logs were found, so adherence trends and safety review are incomplete.", category: "records", severity: "info", href: "/medication-safety", action: "Review medication safety", evidence: "0 medication logs in the last 30 days" });
  if (input.vitals === 0 || latestVitalAge === null || latestVitalAge > 14) push(items, { id: "vitals-stale", title: "Refresh recent vitals", description: "Vitals monitor, trends, and emergency reports are stronger when vital signs are recent.", category: "records", severity: input.vitals === 0 ? "warning" : "info", href: "/vitals", action: "Add vitals", evidence: `Latest vital: ${ageLabel(now, input.latestVitalDate)}` });
  if (input.labs === 0 || latestLabAge === null || latestLabAge > 180) push(items, { id: "labs-stale", title: "Add or refresh lab results", description: "Lab review and provider packets are more useful when recent lab context is available.", category: "records", severity: input.labs === 0 ? "warning" : "info", href: "/labs", action: "Add lab result", evidence: `Latest lab: ${ageLabel(now, input.latestLabDate)}` });
  if (input.abnormalLabs > 0) push(items, { id: "abnormal-labs-review", title: "Review abnormal or borderline labs", description: "Flagged lab results should be reviewed before doctor packets or care-team handoffs.", category: "safety", severity: "warning", href: "/lab-review", action: "Open lab review", evidence: `${input.abnormalLabs} flagged lab result${input.abnormalLabs === 1 ? "" : "s"}` });
  if (input.highRiskAlerts > 0) push(items, { id: "high-risk-alerts", title: "Resolve high-risk open alerts", description: "Critical or high-priority alerts should be handled before sharing reports.", category: "safety", severity: "critical", href: "/alerts", action: "Review alerts", evidence: `${input.highRiskAlerts} high-risk open alert${input.highRiskAlerts === 1 ? "" : "s"}` });
  if (input.severeOpenSymptoms > 0) push(items, { id: "severe-open-symptoms", title: "Review severe unresolved symptoms", description: "Severe unresolved symptoms should be checked before visit prep or external handoff.", category: "safety", severity: "critical", href: "/symptom-review", action: "Open symptom review", evidence: `${input.severeOpenSymptoms} severe unresolved symptom${input.severeOpenSymptoms === 1 ? "" : "s"}` });
  if (input.overdueReminders > 0) push(items, { id: "overdue-reminders", title: "Clear overdue and missed reminders", description: "Overdue reminders can indicate missed follow-ups, medication tasks, or review work.", category: "safety", severity: "warning", href: "/reminders?state=OVERDUE", action: "Review reminders", evidence: `${input.overdueReminders} overdue or missed reminder${input.overdueReminders === 1 ? "" : "s"}` });
  if (input.activeDeviceConnections === 0) push(items, { id: "device-connections-empty", title: "Connect a device source", description: "Device readings can keep vitals and trends fresh without manual entry.", category: "devices", severity: "info", href: "/device-connection", action: "Open device integrations", evidence: "0 active device connections" });
  if (input.errorDeviceConnections > 0) push(items, { id: "device-errors", title: "Fix device connection errors", description: "Connections with errors may stop readings from reaching vitals, trends, and reports.", category: "devices", severity: "warning", href: "/device-connection?status=ERROR", action: "Review device errors", evidence: `${input.errorDeviceConnections} connection${input.errorDeviceConnections === 1 ? "" : "s"} in error status` });
  if (input.staleDeviceConnections > 0) push(items, { id: "device-sync-stale", title: "Refresh stale device syncs", description: "Active device connections that have not synced recently should be checked before relying on trends.", category: "devices", severity: "warning", href: "/device-connection?health=STALE", action: "Review stale syncs", evidence: `${input.staleDeviceConnections} stale active connection${input.staleDeviceConnections === 1 ? "" : "s"}` });
  if (input.failedSyncJobs > 0) push(items, { id: "failed-sync-jobs", title: "Review failed device sync jobs", description: "Failed sync jobs can explain missing readings and should be reviewed in Jobs.", category: "devices", severity: "warning", href: "/jobs?device=1&status=FAILED", action: "Open job review", evidence: `${input.failedSyncJobs} failed sync job${input.failedSyncJobs === 1 ? "" : "s"} in the last 14 days` });
  if (input.documents === 0) push(items, { id: "documents-empty", title: "Upload supporting documents", description: "Lab files, prescriptions, and discharge papers improve export and review quality.", category: "reports", severity: "info", href: "/documents", action: "Upload document", evidence: "0 uploaded documents" });
  else if (documentLinkRate < 60) push(items, { id: "documents-unlinked", title: "Link documents to records", description: "Unlinked documents are harder to interpret during exports, lab review, and visit prep.", category: "reports", severity: "warning", href: "/documents?link=UNLINKED", action: "Link documents", evidence: `${documentLinkRate}% document link coverage` });
  if (input.careTeamMembers === 0) push(items, { id: "care-team-empty", title: "Add at least one care-team member", description: "Care-team sharing makes collaboration, notes, and handoff workflows more realistic.", category: "collaboration", severity: "info", href: "/care-team", action: "Invite care team", evidence: "0 active care-team members" });
  if (input.urgentCareNotes > 0) push(items, { id: "urgent-care-notes", title: "Review urgent care notes", description: "Urgent or high-priority notes should be included in report builder and care-team handoffs.", category: "collaboration", severity: "warning", href: "/care-notes", action: "Open care notes", evidence: `${input.urgentCareNotes} urgent/high-priority care note${input.urgentCareNotes === 1 ? "" : "s"}` });

  const byCategory = (category: DataQualityCategory) => items.filter((item) => item.category === category);
  const sections = [
    section("profile", "Profile readiness", "Identity, emergency contact, allergies, conditions, and baseline demographics.", [profileCompletion >= 80, emergencyReady, Boolean(input.profile?.allergiesSummary), Boolean(input.profile?.chronicConditions)], [{ label: "Completion", value: `${profileCompletion}%`, description: `${profileCompleted}/${profileFields.length} baseline fields`, tone: toneFromScore(profileCompletion) }, { label: "Emergency contact", value: emergencyReady ? "Ready" : "Missing", description: "Required for emergency card and summary packets", tone: emergencyReady ? "success" : "danger" }], byCategory("profile")),
    section("records", "Record completeness", "Medication, vitals, labs, appointments, vaccinations, and provider coverage.", [input.activeMedications > 0, input.medicationsWithoutSchedules === 0, input.vitals > 0 && (latestVitalAge ?? 999) <= 14, input.labs > 0 && (latestLabAge ?? 999) <= 180, input.doctors > 0 || input.appointments > 0], [{ label: "Active medications", value: input.activeMedications, description: `${input.medicationsWithoutSchedules} without schedules`, tone: input.activeMedications > 0 && input.medicationsWithoutSchedules === 0 ? "success" : "warning" }, { label: "Latest vital", value: ageLabel(now, input.latestVitalDate), description: `${input.vitals} vital records`, tone: input.vitals > 0 && (latestVitalAge ?? 999) <= 14 ? "success" : "warning" }, { label: "Latest lab", value: ageLabel(now, input.latestLabDate), description: `${input.labs} lab results`, tone: input.labs > 0 && (latestLabAge ?? 999) <= 180 ? "success" : "info" }], byCategory("records")),
    section("safety", "Safety and review queue", "Open alerts, severe symptoms, abnormal labs, overdue reminders, and missed medication signals.", [input.highRiskAlerts === 0, input.severeOpenSymptoms === 0, input.overdueReminders === 0, input.abnormalLabs === 0, input.missedMedicationLogs30d === 0], [{ label: "Open alerts", value: input.openAlerts, description: `${input.highRiskAlerts} high-risk`, tone: input.highRiskAlerts > 0 ? "danger" : input.openAlerts > 0 ? "warning" : "success" }, { label: "Flagged labs", value: input.abnormalLabs, description: "Abnormal, high, low, or borderline", tone: input.abnormalLabs > 0 ? "warning" : "success" }, { label: "Overdue reminders", value: input.overdueReminders, description: "Overdue or missed states", tone: input.overdueReminders > 0 ? "warning" : "success" }], byCategory("safety")),
    section("devices", "Device sync health", "Active connections, recent readings, sync failures, and device freshness.", [input.activeDeviceConnections > 0, input.errorDeviceConnections === 0, input.staleDeviceConnections === 0, input.failedSyncJobs === 0, input.recentDeviceReadings > 0], [{ label: "Active connections", value: input.activeDeviceConnections, description: `${input.errorDeviceConnections} error / ${input.staleDeviceConnections} stale`, tone: input.errorDeviceConnections > 0 ? "danger" : input.staleDeviceConnections > 0 ? "warning" : input.activeDeviceConnections > 0 ? "success" : "info" }, { label: "Recent readings", value: input.recentDeviceReadings, description: "Last 14 days", tone: input.recentDeviceReadings > 0 ? "success" : "info" }, { label: "Failed sync jobs", value: input.failedSyncJobs, description: "Last 14 days", tone: input.failedSyncJobs > 0 ? "warning" : "success" }], byCategory("devices")),
    section("reports", "Export and report quality", "Document coverage, linked evidence, printable summaries, and report readiness.", [input.documents > 0, input.documents > 0 && documentLinkRate >= 60, profileCompletion >= 80, input.openAlerts === 0, input.abnormalLabs === 0], [{ label: "Documents", value: input.documents, description: `${input.linkedDocuments} linked`, tone: input.documents > 0 ? "success" : "info" }, { label: "Link coverage", value: `${documentLinkRate}%`, description: "Documents connected to source records", tone: documentLinkRate >= 60 ? "success" : input.documents > 0 ? "warning" : "info" }], byCategory("reports")),
    section("collaboration", "Care-team collaboration", "Care-team access, shared notes, high-priority handoffs, and collaboration readiness.", [input.careTeamMembers > 0, input.urgentCareNotes === 0, input.activeCareNotes > 0], [{ label: "Care-team members", value: input.careTeamMembers, description: "Active sharing relationships", tone: input.careTeamMembers > 0 ? "success" : "info" }, { label: "Care notes", value: input.activeCareNotes, description: `${input.urgentCareNotes} urgent/high-priority`, tone: input.urgentCareNotes > 0 ? "warning" : input.activeCareNotes > 0 ? "success" : "info" }], byCategory("collaboration")),
  ];
  const score = Math.round(sections.reduce((total, current) => total + current.score, 0) / sections.length);
  const allItems = sections.flatMap((current) => current.items);
  const severityRank: Record<DataQualitySeverity, number> = { critical: 0, warning: 1, info: 2, healthy: 3 };
  return { summary: { score, readinessLabel: labelFromScore(score), criticalItems: allItems.filter((item) => item.severity === "critical").length, warningItems: allItems.filter((item) => item.severity === "warning").length, generatedAt: now }, sections, topActions: [...allItems].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 6) };
}

export async function getDataQualityCenterData(userId: string): Promise<DataQualityCenterData> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const staleDeviceCutoff = new Date(now); staleDeviceCutoff.setHours(staleDeviceCutoff.getHours() - 48);
  const [profile, activeMedications, medicationsWithoutSchedules, medicationLogs30d, missedMedicationLogs30d, appointments, upcomingAppointments, doctors, labs, abnormalLabs, latestLab, vitals, latestVital, symptoms, severeOpenSymptoms, vaccinations, overdueReminders, openAlerts, highRiskAlerts, documents, linkedDocuments, careTeamMembers, activeCareNotes, urgentCareNotes, activeDeviceConnections, staleDeviceConnections, errorDeviceConnections, recentDeviceReadings, failedSyncJobs] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.medication.count({ where: { userId, status: MedicationStatus.ACTIVE, active: true } }),
    db.medication.count({ where: { userId, status: MedicationStatus.ACTIVE, active: true, schedules: { none: {} } } }),
    db.medicationLog.count({ where: { userId, loggedAt: { gte: thirtyDaysAgo } } }),
    db.medicationLog.count({ where: { userId, loggedAt: { gte: thirtyDaysAgo }, status: { in: [MedicationLogStatus.MISSED, MedicationLogStatus.SKIPPED] } } }),
    db.appointment.count({ where: { userId } }),
    db.appointment.count({ where: { userId, scheduledAt: { gte: now } } }),
    db.doctor.count({ where: { userId } }),
    db.labResult.count({ where: { userId } }),
    db.labResult.count({ where: { userId, flag: { in: [LabFlag.BORDERLINE, LabFlag.HIGH, LabFlag.LOW] } } }),
    db.labResult.findFirst({ where: { userId }, orderBy: { dateTaken: "desc" }, select: { dateTaken: true } }),
    db.vitalRecord.count({ where: { userId } }),
    db.vitalRecord.findFirst({ where: { userId }, orderBy: { recordedAt: "desc" }, select: { recordedAt: true } }),
    db.symptomEntry.count({ where: { userId } }),
    db.symptomEntry.count({ where: { userId, severity: SymptomSeverity.SEVERE, resolved: false } }),
    db.vaccinationRecord.count({ where: { userId } }),
    db.reminder.count({ where: { userId, state: { in: [ReminderState.OVERDUE, ReminderState.MISSED] } } }),
    db.alertEvent.count({ where: { userId, status: AlertStatus.OPEN } }),
    db.alertEvent.count({ where: { userId, status: AlertStatus.OPEN, severity: { in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] } } }),
    db.medicalDocument.count({ where: { userId } }),
    db.medicalDocument.count({ where: { userId, linkedRecordType: { not: null }, linkedRecordId: { not: null } } }),
    db.careAccess.count({ where: { ownerUserId: userId, status: CareAccessStatus.ACTIVE } }),
    db.careNote.count({ where: { ownerUserId: userId, archivedAt: null } }),
    db.careNote.count({ where: { ownerUserId: userId, archivedAt: null, priority: { in: [CareNotePriority.HIGH, CareNotePriority.URGENT] } } }),
    db.deviceConnection.count({ where: { userId, status: DeviceConnectionStatus.ACTIVE } }),
    db.deviceConnection.count({ where: { userId, status: DeviceConnectionStatus.ACTIVE, OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleDeviceCutoff } }] } }),
    db.deviceConnection.count({ where: { userId, status: DeviceConnectionStatus.ERROR } }),
    db.deviceReading.count({ where: { userId, capturedAt: { gte: fourteenDaysAgo } } }),
    db.syncJob.count({ where: { userId, status: SyncJobStatus.FAILED, createdAt: { gte: fourteenDaysAgo } } }),
  ]);
  return buildDataQualityCenterData({ now, profile, activeMedications, medicationsWithoutSchedules, medicationLogs30d, missedMedicationLogs30d, appointments, upcomingAppointments, doctors, labs, abnormalLabs, latestLabDate: latestLab?.dateTaken ?? null, vitals, latestVitalDate: latestVital?.recordedAt ?? null, symptoms, severeOpenSymptoms, vaccinations, overdueReminders, openAlerts, highRiskAlerts, documents, linkedDocuments, careTeamMembers, activeCareNotes, urgentCareNotes, activeDeviceConnections, staleDeviceConnections, errorDeviceConnections, recentDeviceReadings, failedSyncJobs });
}
