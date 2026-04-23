export type ExportTypeDefinition = {
  type: string;
  href: string;
  title: string;
  description: string;
  format: "CSV";
  group: "Core" | "Monitoring" | "Coordination";
};

export const exportDefinitions: ExportTypeDefinition[] = [
  {
    type: "appointments",
    href: "/exports/appointments",
    title: "Appointments CSV",
    description: "Visit history, clinics, doctors, schedules, and statuses.",
    format: "CSV",
    group: "Core",
  },
  {
    type: "medications",
    href: "/exports/medications",
    title: "Medications CSV",
    description: "Medication plans, dosing schedules, and current treatment status.",
    format: "CSV",
    group: "Core",
  },
  {
    type: "labs",
    href: "/exports/labs",
    title: "Lab Results CSV",
    description: "Lab history with dates, summary findings, and abnormal flags.",
    format: "CSV",
    group: "Core",
  },
  {
    type: "vitals",
    href: "/exports/vitals",
    title: "Vitals CSV",
    description: "Structured vital sign history for spreadsheet review and trend work.",
    format: "CSV",
    group: "Monitoring",
  },
  {
    type: "symptoms",
    href: "/exports/symptoms",
    title: "Symptoms CSV",
    description: "Symptom episodes with severity, timing, body area, and resolution state.",
    format: "CSV",
    group: "Monitoring",
  },
  {
    type: "vaccinations",
    href: "/exports/vaccinations",
    title: "Vaccinations CSV",
    description: "Vaccination record history with doses, locations, and next due dates.",
    format: "CSV",
    group: "Core",
  },
  {
    type: "reminders",
    href: "/exports/reminders",
    title: "Reminders CSV",
    description: "Upcoming, completed, overdue, or skipped reminders with delivery state.",
    format: "CSV",
    group: "Coordination",
  },
  {
    type: "documents",
    href: "/exports/documents",
    title: "Documents Index CSV",
    description: "Document catalog with file names, mime types, sizes, and timestamps.",
    format: "CSV",
    group: "Coordination",
  },
  {
    type: "alerts",
    href: "/exports/alerts",
    title: "Alerts Snapshot CSV",
    description: "Alert history with severity, source references, and resolution status.",
    format: "CSV",
    group: "Coordination",
  },
];

export const exportDefinitionMap = new Map(exportDefinitions.map((item) => [item.type, item]));
