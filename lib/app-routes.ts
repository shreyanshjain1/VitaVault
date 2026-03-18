import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  CalendarClock,
  ClipboardList,
  FileBarChart2,
  FileHeart,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ShieldPlus,
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
    title: "AI Insights",
    href: "/ai-insights",
    description: "Generated health summaries and follow-up questions",
    icon: Sparkles,
  },
  {
    title: "Alerts",
    href: "/alerts",
    description: "Threshold engine, triage queue, and alert audit history",
    icon: BellRing,
  },
  {
    title: "Care Team",
    href: "/care-team",
    description: "Shared access, invites, and collaboration controls",
    icon: Users,
  },
  {
    title: "Health Profile",
    href: "/health-profile",
    description: "Core patient profile, conditions, and safety details",
    icon: FileHeart,
  },
  {
    title: "Medications",
    href: "/medications",
    description: "Medication schedules, adherence logs, and reminders",
    icon: Pill,
  },
  {
    title: "Appointments",
    href: "/appointments",
    description: "Doctor visits, follow-ups, and scheduling history",
    icon: CalendarClock,
  },
  {
    title: "Doctors",
    href: "/doctors",
    description: "Directory of clinicians, specialties, and clinics",
    icon: Stethoscope,
  },
  {
    title: "Labs",
    href: "/labs",
    description: "Lab result tracking and reference flag visibility",
    icon: ClipboardList,
  },
  {
    title: "Vitals",
    href: "/vitals",
    description: "Manual and connected-device vital history",
    icon: HeartPulse,
  },
  {
    title: "Symptoms",
    href: "/symptoms",
    description: "Symptom severity journal and monitoring timeline",
    icon: Activity,
  },
  {
    title: "Vaccinations",
    href: "/vaccinations",
    description: "Immunization timeline and next-dose reminders",
    icon: Syringe,
  },
  {
    title: "Documents",
    href: "/documents",
    description: "Medical files, certificates, scans, and uploads",
    icon: ShieldPlus,
  },
  {
    title: "Summary",
    href: "/summary",
    description: "Printable consolidated health snapshot",
    icon: FileBarChart2,
  },
  {
    title: "Exports",
    href: "/exports",
    description: "CSV and portable records for sharing or backup",
    icon: Workflow,
  },
];

export const utilityRoutes: AppRouteItem[] = [
  {
    title: "Device Connection",
    href: "/device-connection",
    description: "Sync sources, device status, and ingestion health",
    icon: Smartphone,
  },
];
