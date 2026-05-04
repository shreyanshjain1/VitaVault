import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileBarChart2,
  FileHeart,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  Pill,
  ScrollText,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Smartphone,
  Sparkles,
  Stethoscope,
  Syringe,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

export type AppRouteItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type AppRouteSection = {
  label: string;
  description: string;
  items: AppRouteItem[];
};

export const overviewRoutes: AppRouteItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Command center for your health workspace",
    icon: LayoutDashboard,
  },
  {
    title: "Onboarding",
    href: "/onboarding",
    description: "Guided first-run health setup",
    icon: ClipboardCheck,
  },
  {
    title: "Notification Center",
    href: "/notifications",
    description: "Unified inbox for alerts, reminders, records, and care updates",
    icon: Inbox,
  },
  {
    title: "Care Plan",
    href: "/care-plan",
    description: "Prioritized next steps across records, alerts, reminders, and visits",
    icon: ClipboardCheck,
  },
  {
    title: "Visit Prep",
    href: "/visit-prep",
    description: "Provider-ready visit packet, prep tasks, and care context",
    icon: ClipboardList,
  },
];

export const recordRoutes: AppRouteItem[] = [
  {
    title: "Health Profile",
    href: "/health-profile",
    description: "Profile, allergies, conditions, emergency contacts",
    icon: FileHeart,
  },
  {
    title: "Medications",
    href: "/medications",
    description: "Schedules, adherence logs, and reminders",
    icon: Pill,
  },
  {
    title: "Appointments",
    href: "/appointments",
    description: "Visits, follow-ups, doctors, and notes",
    icon: CalendarClock,
  },
  {
    title: "Lab Results",
    href: "/labs",
    description: "Results, abnormal flags, and uploads",
    icon: ClipboardList,
  },
  {
    title: "Vitals",
    href: "/vitals",
    description: "BP, sugar, oxygen, weight, and trends",
    icon: HeartPulse,
  },
  {
    title: "Symptoms",
    href: "/symptoms",
    description: "Symptom journal and severity history",
    icon: Activity,
  },
  {
    title: "Vaccinations",
    href: "/vaccinations",
    description: "Dose history and next due tracking",
    icon: Syringe,
  },
  {
    title: "Documents",
    href: "/documents",
    description: "Medical files, scans, and uploads",
    icon: ShieldPlus,
  },
  {
    title: "Doctors",
    href: "/doctors",
    description: "Clinics, contacts, and directory",
    icon: Stethoscope,
  },
  {
    title: "Timeline",
    href: "/timeline",
    description: "Longitudinal view of records and care events",
    icon: Workflow,
  },
];

export const monitoringRoutes: AppRouteItem[] = [
  {
    title: "Health Trends",
    href: "/trends",
    description: "Longitudinal vitals, labs, symptoms, and adherence analytics",
    icon: TrendingUp,
  },
  {
    title: "Medication Safety",
    href: "/medication-safety",
    description: "Adherence, dose coverage, refill risk, and medication safety review",
    icon: ShieldCheck,
  },
  {
    title: "Lab Review",
    href: "/lab-review",
    description: "Abnormal results, lab trends, documents, and follow-up readiness",
    icon: ClipboardList,
  },
  {
    title: "Vitals Monitor",
    href: "/vitals-monitor",
    description: "Focused vital signs, device coverage, and urgent reading review",
    icon: HeartPulse,
  },
  {
    title: "Symptom Review",
    href: "/symptom-review",
    description: "Unresolved symptoms, body-area clusters, alerts, and care handoff notes",
    icon: Activity,
  },
  {
    title: "Alert Center",
    href: "/alerts",
    description: "Alert events, thresholds, and follow-up workflows",
    icon: BellRing,
  },
  {
    title: "Reminders",
    href: "/reminders",
    description: "In-app reminder center for due and overdue tasks",
    icon: BellRing,
  },
  {
    title: "Review Queue",
    href: "/review-queue",
    description: "Focused review list for care follow-ups and print workflows",
    icon: ClipboardCheck,
  },
  {
    title: "Device Connections",
    href: "/device-connection",
    description: "Integration roadmap for phone and health devices",
    icon: Smartphone,
  },
  {
    title: "Device Sync Simulator",
    href: "/device-sync-simulator",
    description: "Run sample device syncs into readings, jobs, and mirrored vitals",
    icon: Workflow,
  },
];

export const sharingReportRoutes: AppRouteItem[] = [
  {
    title: "Care Team",
    href: "/care-team",
    description: "Invite caregivers and manage shared access",
    icon: Users,
  },
  {
    title: "AI Insights",
    href: "/ai-insights",
    description: "Generate concise summaries from your records",
    icon: Sparkles,
  },
  {
    title: "Emergency Card",
    href: "/emergency-card",
    description: "Printable critical care card",
    icon: ShieldAlert,
  },
  {
    title: "Summary",
    href: "/summary",
    description: "Printable patient summary view",
    icon: FileBarChart2,
  },
  {
    title: "Exports",
    href: "/exports",
    description: "Export records and reports",
    icon: FileBarChart2,
  },
];

export const adminOpsRoutes: AppRouteItem[] = [
  {
    title: "Security",
    href: "/security",
    description: "Password rotation and mobile session visibility",
    icon: ShieldCheck,
  },
  {
    title: "Audit Log",
    href: "/audit-log",
    description: "Unified audit trail across access, alerts, reminders, jobs, and sessions",
    icon: ScrollText,
  },
  {
    title: "Admin",
    href: "/admin",
    description: "User oversight, audit review, and system visibility",
    icon: Users,
  },
  {
    title: "Jobs",
    href: "/jobs",
    description: "Inspect worker queues, retries, and job runs",
    icon: Workflow,
  },
  {
    title: "Operations",
    href: "/ops",
    description: "Deployment readiness, workload risk, and operational runbooks",
    icon: ServerCog,
  },
  {
    title: "API Docs",
    href: "/api-docs",
    description: "Mobile and device API reference for reviewers and future clients",
    icon: BookOpen,
  },
];

export const navigationSections: AppRouteSection[] = [
  {
    label: "Overview",
    description: "Daily workspace, triage, and preparation",
    items: overviewRoutes,
  },
  {
    label: "Records",
    description: "Core health record modules",
    items: recordRoutes,
  },
  {
    label: "Monitoring",
    description: "Safety, trends, reviews, and follow-up queues",
    items: monitoringRoutes,
  },
  {
    label: "Sharing & Reports",
    description: "Care collaboration, packets, summaries, and exports",
    items: sharingReportRoutes,
  },
  {
    label: "Admin & Ops",
    description: "Security, audit, admin, jobs, ops, and API visibility",
    items: adminOpsRoutes,
  },
];

export const primaryRoutes: AppRouteItem[] = [
  ...overviewRoutes,
  ...recordRoutes,
  ...monitoringRoutes,
  ...sharingReportRoutes,
];

export const utilityRoutes: AppRouteItem[] = [...adminOpsRoutes];

export const allAppRoutes: AppRouteItem[] = navigationSections.flatMap((section) => section.items);
