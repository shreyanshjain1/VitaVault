import {
  AlertSeverity,
  AlertStatus,
  AppointmentStatus,
  CareAccessStatus,
  LabFlag,
  MedicationStatus,
  ReminderState,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";

export type CarePlanPriority = "critical" | "high" | "medium" | "low";
export type CarePlanTone = "danger" | "warning" | "info" | "success" | "neutral";

export type CarePlanTask = {
  id: string;
  title: string;
  detail: string;
  source: "Alert" | "Reminder" | "Appointment" | "Lab" | "Symptom" | "Medication" | "Document" | "Profile";
  priority: CarePlanPriority;
  tone: CarePlanTone;
  dueLabel: string;
  href: string;
};

export type CarePlanTimelineItem = {
  id: string;
  when: Date;
  title: string;
  detail: string;
  type: "appointment" | "reminder" | "vaccination";
  href: string;
  tone: CarePlanTone;
};

export type CarePlanSection = {
  title: string;
  score: number;
  status: string;
  tone: CarePlanTone;
  checks: Array<{ label: string; complete: boolean; detail: string }>;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(value);
}

function daysFromNow(value: Date) {
  const now = new Date();
  const ms = value.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function dueLabel(value: Date) {
  const days = daysFromNow(value);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function priorityRank(priority: CarePlanPriority) {
  return priority === "critical" ? 4 : priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function alertPriority(severity: AlertSeverity): CarePlanPriority {
  if (severity === AlertSeverity.CRITICAL) return "critical";
  if (severity === AlertSeverity.HIGH) return "high";
  if (severity === AlertSeverity.MEDIUM) return "medium";
  return "low";
}

function priorityTone(priority: CarePlanPriority): CarePlanTone {
  if (priority === "critical" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "info";
}

export async function getCarePlanHubData(userId: string) {
  const now = new Date();
  const next30Days = new Date(now);
  next30Days.setDate(next30Days.getDate() + 30);

  const [
    profile,
    medications,
    reminders,
    appointments,
    labs,
    symptoms,
    vaccinations,
    documents,
    alerts,
    doctors,
    careInvites,
    careAccess,
    latestVitals,
  ] = await Promise.all([
    db.healthProfile.findUnique({ where: { userId } }),
    db.medication.findMany({
      where: { userId, status: MedicationStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { schedules: { orderBy: { timeOfDay: "asc" } } },
    }),
    db.reminder.findMany({
      where: {
        userId,
        completed: false,
        state: { in: [ReminderState.DUE, ReminderState.OVERDUE, ReminderState.MISSED, ReminderState.SENT] },
      },
      orderBy: { dueAt: "asc" },
      take: 12,
    }),
    db.appointment.findMany({
      where: { userId, status: AppointmentStatus.UPCOMING, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      take: 8,
    }),
    db.labResult.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 10 }),
    db.symptomEntry.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 10 }),
    db.vaccinationRecord.findMany({ where: { userId }, orderBy: { dateTaken: "desc" }, take: 8 }),
    db.medicalDocument.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 14 }),
    db.alertEvent.findMany({
      where: { userId, status: AlertStatus.OPEN },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
    db.doctor.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.careInvite.findMany({ where: { ownerUserId: userId, status: CareAccessStatus.PENDING }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.careAccess.findMany({ where: { ownerUserId: userId, status: CareAccessStatus.ACTIVE }, orderBy: { createdAt: "desc" }, take: 6, include: { member: { select: { id: true, name: true, email: true } } } }),
    db.vitalRecord.findMany({ where: { userId }, orderBy: { recordedAt: "desc" }, take: 3 }),
  ]);

  const tasks: CarePlanTask[] = [];

  if (!profile) {
    tasks.push({
      id: "profile-missing",
      title: "Complete health profile",
      detail: "Add baseline identity, emergency contact, allergies, and chronic condition details.",
      source: "Profile",
      priority: "high",
      tone: "danger",
      dueLabel: "Recommended now",
      href: "/onboarding",
    });
  } else {
    if (!profile.emergencyContactName || !profile.emergencyContactPhone) {
      tasks.push({
        id: "profile-emergency-contact",
        title: "Add emergency contact",
        detail: "Your emergency card and doctor handoff packet are stronger when emergency contact details are complete.",
        source: "Profile",
        priority: "high",
        tone: "danger",
        dueLabel: "Recommended now",
        href: "/health-profile",
      });
    }
    if (!profile.allergiesSummary) {
      tasks.push({
        id: "profile-allergies",
        title: "Record allergy information",
        detail: "Add known allergies or explicitly note that there are no known allergies.",
        source: "Profile",
        priority: "medium",
        tone: "warning",
        dueLabel: "Recommended soon",
        href: "/health-profile",
      });
    }
  }

  for (const alert of alerts) {
    const priority = alertPriority(alert.severity);
    tasks.push({
      id: `alert-${alert.id}`,
      title: alert.title,
      detail: alert.message,
      source: "Alert",
      priority,
      tone: priorityTone(priority),
      dueLabel: `Opened ${formatDate(alert.createdAt)}`,
      href: `/alerts/${alert.id}`,
    });
  }

  for (const reminder of reminders) {
    const isOverdue = reminder.dueAt < now || reminder.state === ReminderState.OVERDUE || reminder.state === ReminderState.MISSED;
    tasks.push({
      id: `reminder-${reminder.id}`,
      title: reminder.title,
      detail: reminder.description || `${reminder.type} reminder through ${reminder.channel}`,
      source: "Reminder",
      priority: isOverdue ? "high" : "medium",
      tone: isOverdue ? "danger" : "warning",
      dueLabel: dueLabel(reminder.dueAt),
      href: "/reminders",
    });
  }

  for (const lab of labs.filter((item) => item.flag !== LabFlag.NORMAL).slice(0, 4)) {
    tasks.push({
      id: `lab-${lab.id}`,
      title: `Review ${lab.testName}`,
      detail: `${lab.resultSummary}${lab.referenceRange ? ` • Ref: ${lab.referenceRange}` : ""}`,
      source: "Lab",
      priority: lab.flag === LabFlag.BORDERLINE ? "medium" : "high",
      tone: lab.flag === LabFlag.BORDERLINE ? "warning" : "danger",
      dueLabel: `Taken ${formatDate(lab.dateTaken)}`,
      href: "/labs",
    });
  }

  for (const symptom of symptoms.filter((item) => !item.resolved && item.severity !== SymptomSeverity.MILD).slice(0, 4)) {
    tasks.push({
      id: `symptom-${symptom.id}`,
      title: `Follow up on ${symptom.title}`,
      detail: symptom.notes || `${symptom.severity} symptom${symptom.bodyArea ? ` affecting ${symptom.bodyArea}` : ""}`,
      source: "Symptom",
      priority: symptom.severity === SymptomSeverity.SEVERE ? "high" : "medium",
      tone: symptom.severity === SymptomSeverity.SEVERE ? "danger" : "warning",
      dueLabel: `Started ${formatDate(symptom.startedAt)}`,
      href: "/symptoms",
    });
  }

  const unlinkedDocuments = documents.filter((item) => !item.linkedRecordType || !item.linkedRecordId);
  if (unlinkedDocuments.length > 0) {
    tasks.push({
      id: "documents-unlinked",
      title: "Link important documents to records",
      detail: `${unlinkedDocuments.length} document${unlinkedDocuments.length === 1 ? "" : "s"} need record linking for better doctor handoff context.`,
      source: "Document",
      priority: "medium",
      tone: "warning",
      dueLabel: "Recommended soon",
      href: "/documents?link=UNLINKED",
    });
  }

  if (medications.length === 0) {
    tasks.push({
      id: "medications-empty",
      title: "Add active medications",
      detail: "Medication history is one of the most useful parts of a doctor visit packet.",
      source: "Medication",
      priority: "medium",
      tone: "warning",
      dueLabel: "Recommended soon",
      href: "/medications",
    });
  }

  const sortedTasks = tasks.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0, 12);

  const timeline: CarePlanTimelineItem[] = [
    ...appointments.map((item) => ({
      id: `appointment-${item.id}`,
      when: item.scheduledAt,
      title: item.purpose,
      detail: `${item.doctorName} • ${item.clinic}`,
      type: "appointment" as const,
      href: "/appointments",
      tone: "info" as const,
    })),
    ...reminders.map((item) => ({
      id: `reminder-${item.id}`,
      when: item.dueAt,
      title: item.title,
      detail: item.description || `${item.type} reminder`,
      type: "reminder" as const,
      href: "/reminders",
      tone: item.dueAt < now ? "danger" as const : "warning" as const,
    })),
    ...vaccinations
      .filter((item) => item.nextDueDate && item.nextDueDate >= now && item.nextDueDate <= next30Days)
      .map((item) => ({
        id: `vaccination-${item.id}`,
        when: item.nextDueDate as Date,
        title: `${item.vaccineName} next dose`,
        detail: item.location || "Vaccination follow-up",
        type: "vaccination" as const,
        href: "/vaccinations",
        tone: "info" as const,
      })),
  ].sort((a, b) => a.when.getTime() - b.when.getTime()).slice(0, 10);

  const profileChecks = [
    { label: "Profile created", complete: Boolean(profile), detail: profile ? "Baseline profile exists" : "Create your profile" },
    { label: "Emergency contact", complete: Boolean(profile?.emergencyContactName && profile?.emergencyContactPhone), detail: "Required for emergency card readiness" },
    { label: "Allergy context", complete: Boolean(profile?.allergiesSummary), detail: "Needed for doctor handoff and emergency context" },
    { label: "Blood type", complete: Boolean(profile?.bloodType), detail: "Useful in emergency packet" },
  ];

  const recordChecks = [
    { label: "Active medications", complete: medications.length > 0, detail: `${medications.length} active medication${medications.length === 1 ? "" : "s"}` },
    { label: "Care providers", complete: doctors.length > 0, detail: `${doctors.length} provider${doctors.length === 1 ? "" : "s"} saved` },
    { label: "Recent vitals", complete: latestVitals.length > 0, detail: `${latestVitals.length} recent vital snapshot${latestVitals.length === 1 ? "" : "s"}` },
    { label: "Documents linked", complete: documents.length > 0 && unlinkedDocuments.length === 0, detail: `${unlinkedDocuments.length} unlinked document${unlinkedDocuments.length === 1 ? "" : "s"}` },
  ];

  const workflowChecks = [
    { label: "No open high alerts", complete: !alerts.some((item) => item.severity === AlertSeverity.HIGH || item.severity === AlertSeverity.CRITICAL), detail: `${alerts.length} open alert${alerts.length === 1 ? "" : "s"}` },
    { label: "Reminders under control", complete: reminders.filter((item) => item.dueAt < now).length === 0, detail: `${reminders.filter((item) => item.dueAt < now).length} overdue reminder${reminders.filter((item) => item.dueAt < now).length === 1 ? "" : "s"}` },
    { label: "Care team visibility", complete: careAccess.length > 0 || careInvites.length > 0, detail: `${careAccess.length} active share${careAccess.length === 1 ? "" : "s"}, ${careInvites.length} pending invite${careInvites.length === 1 ? "" : "s"}` },
    { label: "Upcoming care plan", complete: timeline.length > 0, detail: `${timeline.length} upcoming care item${timeline.length === 1 ? "" : "s"}` },
  ];

  const sectionFromChecks = (title: string, checks: typeof profileChecks): CarePlanSection => {
    const completed = checks.filter((item) => item.complete).length;
    const score = clampScore((completed / checks.length) * 100);
    return {
      title,
      score,
      status: score >= 85 ? "Strong" : score >= 60 ? "Needs polish" : "Needs setup",
      tone: score >= 85 ? "success" : score >= 60 ? "warning" : "danger",
      checks,
    };
  };

  const sections = [
    sectionFromChecks("Profile readiness", profileChecks),
    sectionFromChecks("Record readiness", recordChecks),
    sectionFromChecks("Workflow readiness", workflowChecks),
  ];

  const overallScore = clampScore(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  const criticalCount = sortedTasks.filter((item) => item.priority === "critical").length;
  const highCount = sortedTasks.filter((item) => item.priority === "high").length;

  return {
    profile,
    overallScore,
    readinessTone: overallScore >= 85 ? "success" as const : overallScore >= 60 ? "warning" as const : "danger" as const,
    tasks: sortedTasks,
    timeline,
    sections,
    stats: {
      criticalCount,
      highCount,
      activeMedications: medications.length,
      openAlerts: alerts.length,
      upcomingAppointments: appointments.length,
      pendingInvites: careInvites.length,
      activeCareMembers: careAccess.length,
      unlinkedDocuments: unlinkedDocuments.length,
      abnormalLabs: labs.filter((item) => item.flag !== LabFlag.NORMAL).length,
      unresolvedSymptoms: symptoms.filter((item) => !item.resolved).length,
    },
    medications: medications.slice(0, 5),
    doctors: doctors.slice(0, 5),
    latestVitals,
  };
}
