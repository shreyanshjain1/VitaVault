import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  FileBarChart2,
  FileHeart,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
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
    description: "Overview, reminders, trends, AI, and care-team activity",
    icon: LayoutDashboard,
  },
  {
    title: "AI Insights",
    href: "/ai-insights",
    description: "Generate and review patient-ready AI summaries",
    icon: Sparkles,
  },
  {
    title: "Care Team",
    href: "/care-team",
    description: "Invite caregivers and doctors, manage shared access",
    icon: Users,
  },
  {
    title: "Health Profile",
    href: "/health-profile",
    description: "Basic profile, allergies, conditions, and emergency contacts",
    icon: FileHeart,
  },
  {
    title: "Medications",
    href: "/medications",
    description: "Medication schedule and adherence logs",
    icon: Pill,
  },
  {
    title: "Appointments",
    href: "/appointments",
    description: "Clinic visits, doctors, and follow-up notes",
    icon: CalendarClock,
  },
  {
    title: "Lab Results",
    href: "/labs",
    description: "Lab tracking, uploads, and abnormal flags",
    icon: ClipboardList,
  },
  {
    title: "Vitals",
    href: "/vitals",
    description: "Blood pressure, sugar, oxygen, weight, and trends",
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
    description: "Vaccine history and next due tracking",
    icon: Syringe,
  },
  {
    title: "Documents",
    href: "/documents",
    description: "Medical files, scanned records, and uploads",
    icon: ShieldPlus,
  },
  {
    title: "Doctors",
    href: "/doctors",
    description: "Doctors, clinics, and contact directory",
    icon: Stethoscope,
  },
  {
    title: "Summary",
    href: "/summary",
    description: "Printable patient summary and PDF-ready view",
    icon: FileBarChart2,
  },
];

export const utilityRoutes: AppRouteItem[] = [
  {
    title: "Exports",
    href: "/exports",
    description: "Export medication, appointment, lab, and vital data",
    icon: FileBarChart2,
  },
];