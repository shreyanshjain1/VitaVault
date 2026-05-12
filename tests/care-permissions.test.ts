import { describe, expect, it } from "vitest";

import {
  buildCarePermissionMatrix,
  canUseCarePermission,
  carePermissionWorkflowChecklist,
  normalizeCarePermissionInput,
  summarizeCarePermissionAccess,
  type CarePermissionContext,
} from "@/lib/care-permissions";

function access(overrides: Partial<CarePermissionContext> = {}): CarePermissionContext {
  return {
    accessRole: "CAREGIVER",
    canViewRecords: true,
    canEditRecords: false,
    canAddNotes: false,
    canExport: false,
    canGenerateAIInsights: false,
    ...overrides,
  };
}

describe("care permission enforcement helpers", () => {
  it("treats owners as fully authorized across care-team workflows", () => {
    const owner = access({
      accessRole: "OWNER",
      isOwner: true,
      canViewRecords: false,
      canEditRecords: false,
      canAddNotes: false,
      canExport: false,
      canGenerateAIInsights: false,
    });

    expect(canUseCarePermission(owner, "view")).toBe(true);
    expect(canUseCarePermission(owner, "edit")).toBe(true);
    expect(canUseCarePermission(owner, "notes")).toBe(true);
    expect(canUseCarePermission(owner, "export")).toBe(true);
    expect(canUseCarePermission(owner, "ai")).toBe(true);
  });

  it("requires view access before scoped care-team permissions can be used", () => {
    const noView = access({
      canViewRecords: false,
      canEditRecords: true,
      canAddNotes: true,
      canExport: true,
      canGenerateAIInsights: true,
    });

    expect(canUseCarePermission(noView, "view")).toBe(false);
    expect(canUseCarePermission(noView, "edit")).toBe(false);
    expect(canUseCarePermission(noView, "notes")).toBe(false);
    expect(canUseCarePermission(noView, "export")).toBe(false);
    expect(canUseCarePermission(noView, "ai")).toBe(false);
    expect(canUseCarePermission(noView, "alerts")).toBe(false);
  });

  it("maps each scoped permission to the matching persisted care-access flag", () => {
    const grant = access({
      canViewRecords: true,
      canEditRecords: true,
      canAddNotes: false,
      canExport: true,
      canGenerateAIInsights: false,
    });

    expect(canUseCarePermission(grant, "view")).toBe(true);
    expect(canUseCarePermission(grant, "alerts")).toBe(true);
    expect(canUseCarePermission(grant, "edit")).toBe(true);
    expect(canUseCarePermission(grant, "notes")).toBe(false);
    expect(canUseCarePermission(grant, "export")).toBe(true);
    expect(canUseCarePermission(grant, "ai")).toBe(false);
  });

  it("normalizes saved grants so advanced permissions imply view access", () => {
    expect(
      normalizeCarePermissionInput({
        canViewRecords: false,
        canEditRecords: false,
        canAddNotes: true,
        canExport: false,
        canGenerateAIInsights: false,
      })
    ).toEqual({
      canViewRecords: true,
      canEditRecords: false,
      canAddNotes: true,
      canExport: false,
      canGenerateAIInsights: false,
    });
  });

  it("builds a reviewer-friendly permission matrix and summary", () => {
    const grant = access({ canAddNotes: true, canGenerateAIInsights: true });
    const matrix = buildCarePermissionMatrix(grant);
    const summary = summarizeCarePermissionAccess(grant);

    expect(matrix.map((item) => item.label)).toEqual([
      "View records",
      "Edit records",
      "Add notes",
      "Export data",
      "Generate AI insights",
    ]);
    expect(summary.enabledLabels).toEqual(["View records", "Add notes", "Generate AI insights"]);
    expect(summary.disabledLabels).toEqual(["Edit records", "Export data"]);
  });

  it("documents the core workflow permission gates that should stay enforced", () => {
    expect(carePermissionWorkflowChecklist.map((item) => item.permission)).toEqual([
      "view",
      "notes",
      "ai",
      "export",
      "alerts",
    ]);
    expect(carePermissionWorkflowChecklist.map((item) => item.workflow)).toContain("Care note create / pin / archive");
    expect(carePermissionWorkflowChecklist.map((item) => item.workflow)).toContain("Patient AI insight generation");
  });
});
