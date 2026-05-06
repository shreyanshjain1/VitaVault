import { AppRole } from "@prisma/client";

export type RouteAccessLevel = "authenticated" | "admin";

export type RoutePolicy = {
  title: string;
  href: string;
  access: RouteAccessLevel;
  description: string;
};

export const routePolicies = {
  admin: {
    title: "Admin Command Center",
    href: "/admin",
    access: "admin",
    description: "Admin-only account lifecycle, audit, and system visibility.",
  },
  jobs: {
    title: "Background Jobs",
    href: "/jobs",
    access: "admin",
    description: "Admin-only worker queue, retry, and job-run operations.",
  },
  ops: {
    title: "Operations",
    href: "/ops",
    access: "admin",
    description: "Admin-only deployment readiness, workload risk, and operational runbooks.",
  },
  auditLog: {
    title: "Audit Log",
    href: "/audit-log",
    access: "authenticated",
    description: "Scoped audit visibility for regular users and system-wide visibility for admins.",
  },
  apiDocs: {
    title: "API Docs",
    href: "/api-docs",
    access: "authenticated",
    description: "Authenticated reviewer-facing mobile and device API reference.",
  },
  deviceConnection: {
    title: "Device Connections",
    href: "/device-connection",
    access: "authenticated",
    description: "Authenticated roadmap surface for health-device and mobile integration planning.",
  },
} as const satisfies Record<string, RoutePolicy>;

export type RoutePolicyKey = keyof typeof routePolicies;

export function canAccessRoutePolicy(
  policy: RoutePolicy,
  role: AppRole | null | undefined
) {
  if (!role) return false;
  if (policy.access === "admin") return role === AppRole.ADMIN;
  return true;
}

export function isAdminRole(role: AppRole | null | undefined) {
  return role === AppRole.ADMIN;
}

export async function requireRoutePolicy(
  policyKey: RoutePolicyKey,
  redirectTo = "/dashboard"
) {
  const [{ redirect }, { requireUser }] = await Promise.all([
    import("next/navigation"),
    import("@/lib/session"),
  ]);

  const user = await requireUser();
  const policy = routePolicies[policyKey];

  if (!canAccessRoutePolicy(policy, user.role)) {
    redirect(redirectTo);
  }

  return user;
}

export async function requireAdminRoute(redirectTo = "/dashboard") {
  return requireRoutePolicy("admin", redirectTo);
}
