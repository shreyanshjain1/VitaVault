import { describe, expect, it } from "vitest";
import { AppRole } from "@prisma/client";

import {
  adminRoutePolicyKeys,
  canAccessRoutePolicy,
  getAdminRoutePolicies,
  getRoutePolicyByHref,
  isAdminRole,
  routePolicies,
  sensitiveRoutePolicyKeys,
} from "../lib/route-policy";
import {
  adminOpsRoutes,
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

  it("keeps every admin sidebar route backed by an admin route policy", () => {
    const adminPolicyHrefs = new Set<string>(
      getAdminRoutePolicies().map((policy) => policy.href)
    );
    const adminNavigationHrefs = adminOpsRoutes.map((route) => route.href);

    expect(adminNavigationHrefs).toEqual(["/admin", "/jobs", "/ops"]);
    expect(adminNavigationHrefs.every((href) => adminPolicyHrefs.has(href))).toBe(true);
  });

  it("maps nested sensitive routes back to their owning policies", () => {
    expect(getRoutePolicyByHref("/admin?tab=users")?.title).toBe("Admin Command Center");
    expect(getRoutePolicyByHref("/jobs/run-123")?.title).toBe("Background Jobs");
    expect(getRoutePolicyByHref("/ops/")?.title).toBe("Operations");
    expect(getRoutePolicyByHref("/api/jobs/dispatch")?.title).toBe("Job Dispatch API");
    expect(getRoutePolicyByHref("/api/internal/alerts/scan")?.title).toBe("Internal Alert Scan API");
  });

  it("tracks high-risk page and API surfaces in the sensitive policy audit list", () => {
    expect(sensitiveRoutePolicyKeys).toEqual([
      "admin",
      "jobs",
      "ops",
      "jobDispatchApi",
      "internalAlertScanApi",
      "internalAlertEvaluateApi",
    ]);

    const sensitivePolicies = sensitiveRoutePolicyKeys.map((key) => routePolicies[key]);
    const sensitiveHrefs = sensitivePolicies.map((policy) => policy.href);

    expect(sensitiveHrefs).toEqual([
      "/admin",
      "/jobs",
      "/ops",
      "/api/jobs/dispatch",
      "/api/internal/alerts/scan",
      "/api/internal/alerts/evaluate",
    ]);
    expect(adminRoutePolicyKeys).toContain("jobDispatchApi");
    expect(adminRoutePolicyKeys).toContain("internalAlertScanApi");
  });

  it("requires admin access for admin-only API policies", () => {
    expect(canAccessRoutePolicy(routePolicies.jobDispatchApi, AppRole.ADMIN)).toBe(true);
    expect(canAccessRoutePolicy(routePolicies.jobDispatchApi, AppRole.PATIENT)).toBe(false);
    expect(canAccessRoutePolicy(routePolicies.internalAlertScanApi, AppRole.ADMIN)).toBe(true);
    expect(canAccessRoutePolicy(routePolicies.internalAlertScanApi, AppRole.DOCTOR)).toBe(false);
  });
});
