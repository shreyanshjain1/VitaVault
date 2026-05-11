import { AppRole } from "@prisma/client";

export type RouteAccessLevel = "authenticated" | "admin";

export type RoutePolicy = {
  title: string;
  href: string;
  access: RouteAccessLevel;
  description: string;
  surface: "page" | "api";
};

export type ApiRoutePolicyUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: AppRole;
};

export type ApiRoutePolicyResult =
  | {
      ok: true;
      user: ApiRoutePolicyUser;
    }
  | {
      ok: false;
      response: Response;
    };

export const routePolicies = {
  admin: {
    title: "Admin Command Center",
    href: "/admin",
    access: "admin",
    surface: "page",
    description: "Admin-only account lifecycle, audit, and system visibility.",
  },
  jobs: {
    title: "Background Jobs",
    href: "/jobs",
    access: "admin",
    surface: "page",
    description: "Admin-only worker queue, retry, and job-run operations.",
  },
  ops: {
    title: "Operations",
    href: "/ops",
    access: "admin",
    surface: "page",
    description: "Admin-only deployment readiness, workload risk, and operational runbooks.",
  },
  auditLog: {
    title: "Audit Log",
    href: "/audit-log",
    access: "authenticated",
    surface: "page",
    description: "Scoped audit visibility for regular users and system-wide visibility for admins.",
  },
  apiDocs: {
    title: "API Docs",
    href: "/api-docs",
    access: "authenticated",
    surface: "page",
    description: "Authenticated reviewer-facing mobile and device API reference.",
  },
  deviceConnection: {
    title: "Device Connections",
    href: "/device-connection",
    access: "authenticated",
    surface: "page",
    description: "Authenticated roadmap surface for health-device and mobile integration planning.",
  },
  jobDispatchApi: {
    title: "Job Dispatch API",
    href: "/api/jobs/dispatch",
    access: "admin",
    surface: "api",
    description: "Admin-only API endpoint for manually dispatching background jobs.",
  },
  internalAlertScanApi: {
    title: "Internal Alert Scan API",
    href: "/api/internal/alerts/scan",
    access: "admin",
    surface: "api",
    description: "Admin or trusted-token endpoint for queueing a full scheduled alert scan.",
  },
  internalAlertEvaluateApi: {
    title: "Internal Alert Evaluation API",
    href: "/api/internal/alerts/evaluate",
    access: "authenticated",
    surface: "api",
    description: "Authenticated or trusted-token endpoint for queueing scoped alert evaluation.",
  },
} as const satisfies Record<string, RoutePolicy>;

export type RoutePolicyKey = keyof typeof routePolicies;

export const adminRoutePolicyKeys = Object.entries(routePolicies)
  .filter(([, policy]) => policy.access === "admin")
  .map(([key]) => key as RoutePolicyKey);

export const sensitiveRoutePolicyKeys = [
  "admin",
  "jobs",
  "ops",
  "jobDispatchApi",
  "internalAlertScanApi",
  "internalAlertEvaluateApi",
] as const satisfies readonly RoutePolicyKey[];

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

export function getRoutePolicyByHref(href: string) {
  const normalizedHref = href.split("?")[0]?.replace(/\/$/, "") || "/";

  return Object.values(routePolicies).find((policy) => {
    const policyHref = policy.href.replace(/\/$/, "");
    return normalizedHref === policyHref || normalizedHref.startsWith(`${policyHref}/`);
  });
}

export function getAdminRoutePolicies() {
  return adminRoutePolicyKeys.map((key) => routePolicies[key]);
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

export async function requireAdminRoutePolicy(
  policyKey: Extract<RoutePolicyKey, "admin" | "jobs" | "ops">,
  redirectTo = "/dashboard"
) {
  return requireRoutePolicy(policyKey, redirectTo);
}

export async function requireApiRoutePolicy(
  policyKey: RoutePolicyKey
): Promise<ApiRoutePolicyResult> {
  const [{ NextResponse }, { auth }, { db }] = await Promise.all([
    import("next/server"),
    import("@/lib/auth"),
    import("@/lib/db"),
  ]);

  const policy = routePolicies[policyKey];
  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication is required for this route." },
        { status: 401 }
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      deactivatedAt: true,
    },
  });

  if (!user || user.deactivatedAt) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication is required for this route." },
        { status: 401 }
      ),
    };
  }

  if (!canAccessRoutePolicy(policy, user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Only administrators can access ${policy.title}.` },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    },
  };
}
