import { describe, expect, it } from "vitest";
import { AppRole } from "@prisma/client";

import {
  canAccessRoutePolicy,
  isAdminRole,
  routePolicies,
} from "../lib/route-policy";
import {
  getAllAppRoutesForRole,
  getNavigationSectionsForRole,
} from "../lib/app-routes";

describe("role-based route policy", () => {
  it("keeps admin and ops surfaces out of non-admin navigation", () => {
    const patientRoutes = getAllAppRoutesForRole(AppRole.PATIENT).map(
      (route) => route.href
    );

    expect(patientRoutes).not.toContain("/admin");
    expect(patientRoutes).not.toContain("/jobs");
    expect(patientRoutes).not.toContain("/ops");
    expect(patientRoutes).toContain("/audit-log");
    expect(patientRoutes).toContain("/api-docs");
  });

  it("keeps admin navigation grouped in an admin-only section", () => {
    const adminSections = getNavigationSectionsForRole(AppRole.ADMIN);
    const adminOpsSection = adminSections.find(
      (section) => section.label === "Admin & Ops"
    );

    expect(adminOpsSection).toBeDefined();
    expect(adminOpsSection?.items.map((item) => item.href)).toEqual([
      "/admin",
      "/jobs",
      "/ops",
    ]);
  });

  it("marks direct route policies consistently", () => {
    expect(canAccessRoutePolicy(routePolicies.admin, AppRole.ADMIN)).toBe(true);
    expect(canAccessRoutePolicy(routePolicies.jobs, AppRole.ADMIN)).toBe(true);
    expect(canAccessRoutePolicy(routePolicies.ops, AppRole.ADMIN)).toBe(true);

    expect(canAccessRoutePolicy(routePolicies.admin, AppRole.PATIENT)).toBe(false);
    expect(canAccessRoutePolicy(routePolicies.jobs, AppRole.CAREGIVER)).toBe(false);
    expect(canAccessRoutePolicy(routePolicies.ops, AppRole.DOCTOR)).toBe(false);

    expect(canAccessRoutePolicy(routePolicies.auditLog, AppRole.PATIENT)).toBe(true);
    expect(canAccessRoutePolicy(routePolicies.apiDocs, AppRole.CAREGIVER)).toBe(true);
    expect(isAdminRole(AppRole.ADMIN)).toBe(true);
    expect(isAdminRole(AppRole.PATIENT)).toBe(false);
  });
});
