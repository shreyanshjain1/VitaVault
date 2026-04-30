import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  CalendarClock,
  Inbox,
  ClipboardList,
  FileBarChart2,
  FileHeart,
  HeartPulse,
  LayoutDashboard,
  ClipboardCheck,
  Pill,
  ShieldAlert,
  ShieldPlus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
  Workflow,
} from "lucide-react";

export type AppRouteItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const primaryRoutes: AppRouteItem[] = [
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
    title: "Emergency Card",
    href: "/emergency-card",
    description: "Printable critical care card",
    icon: ShieldAlert,
  },
  {
    title: "AI Insights",
    href: "/ai-insights",
    description: "Generate concise summaries from your records",
    icon: Sparkles,
  },
  {
    title: "Care Team",
    href: "/care-team",
    description: "Invite caregivers and manage shared access",
    icon: Users,
  },
  {
    title: "Alert Center",
    href: "/alerts",
    description: "Foundational alert view for future monitoring",
    icon: BellRing,
  },
  {
    title: "Device Connections",
    href: "/device-connection",
    description: "Integration roadmap for phone and health devices",
    icon: Smartphone,
  },
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
    title: "Summary",
    href: "/summary",
    description: "Printable patient summary view",
    icon: FileBarChart2,
  },
  {
    title: "Reminders",
    href: "/reminders",
    description: "In-app reminder center for due and overdue tasks",
    icon: BellRing,
  },
];

export const utilityRoutes: AppRouteItem[] = [
  {
    title: "Security",
    href: "/security",
    description: "Password rotation and mobile session visibility",
    icon: ShieldCheck,
  },
  {
    title: "Admin",
    href: "/admin",
    description: "User oversight, audit review, and system visibility",
    icon: Users,
  },
  {
    title: "Exports",
    href: "/exports",
    description: "Export records and reports",
    icon: FileBarChart2,
  },
  {
    title: "Jobs",
    href: "/jobs",
    description: "Inspect worker queues, retries, and job runs",
    icon: Workflow,
  },
];
