import type { CareAccessRole } from "@prisma/client";

export type CarePermission = "view" | "edit" | "notes" | "export" | "ai" | "alerts";

export type CarePermissionFlags = {
  canViewRecords: boolean;
  canEditRecords: boolean;
  canAddNotes: boolean;
  canExport: boolean;
  canGenerateAIInsights: boolean;
};

export type CarePermissionContext = CarePermissionFlags & {
  accessRole: CareAccessRole | "OWNER";
  isOwner?: boolean;
};

export type CarePermissionMatrixItem = {
  permission: CarePermission;
  label: string;
  enabled: boolean;
  description: string;
};

export const carePermissionLabels: Record<CarePermission, string> = {
  view: "View records",
  edit: "Edit records",
  notes: "Add notes",
  export: "Export data",
  ai: "Generate AI insights",
  alerts: "Review alerts",
};

export const carePermissionDescriptions: Record<CarePermission, string> = {
  view: "Can review shared profile, records, alerts, and care context.",
  edit: "Can update shared patient records where product flows allow edits.",
  notes: "Can contribute care context and follow-up notes in supported workflows.",
  export: "Can prepare printable or downloadable care handoff packets.",
  ai: "Can request AI-assisted summaries for the shared patient record.",
  alerts: "Can review visible alert context from the shared patient workspace.",
};

export const carePermissionOrder: CarePermission[] = ["view", "edit", "notes", "export", "ai"];

export const carePermissionWorkflowChecklist: Array<{
  workflow: string;
  permission: CarePermission;
  enforcement: string;
}> = [
  {
    workflow: "Shared patient workspace",
    permission: "view",
    enforcement: "requireOwnerAccess(actor.id, ownerUserId, 'view')",
  },
  {
    workflow: "Care note create / pin / archive",
    permission: "notes",
    enforcement: "requireOwnerAccess(actor.id, ownerUserId, 'notes')",
  },
  {
    workflow: "Patient AI insight generation",
    permission: "ai",
    enforcement: "requireOwnerAccess(actor.id, ownerUserId, 'ai')",
  },
  {
    workflow: "Patient export / handoff packet visibility",
    permission: "export",
    enforcement: "access.canExport UI gate with server-side permission helpers available",
  },
  {
    workflow: "Shared alert review",
    permission: "alerts",
    enforcement: "alerts inherit the view-records permission gate",
  },
];

function permissionFlag(access: CarePermissionFlags, permission: CarePermission) {
  if (permission === "view" || permission === "alerts") return access.canViewRecords;
  if (permission === "edit") return access.canEditRecords;
  if (permission === "notes") return access.canAddNotes;
  if (permission === "export") return access.canExport;
  return access.canGenerateAIInsights;
}

export function normalizeCarePermissionInput(input: CarePermissionFlags): CarePermissionFlags {
  const hasScopedPermission = input.canEditRecords || input.canAddNotes || input.canExport || input.canGenerateAIInsights;

  return {
    ...input,
    canViewRecords: input.canViewRecords || hasScopedPermission,
  };
}

export function canUseCarePermission(access: CarePermissionContext, permission: CarePermission) {
  if (access.isOwner || access.accessRole === "OWNER") return true;
  if (!access.canViewRecords) return false;
  return permissionFlag(access, permission);
}

export function assertCarePermission(access: CarePermissionContext, permission: CarePermission) {
  if (!canUseCarePermission(access, permission)) {
    throw new Error("You do not have permission for this action.");
  }
}

export function buildCarePermissionMatrix(access: CarePermissionContext): CarePermissionMatrixItem[] {
  return carePermissionOrder.map((permission) => ({
    permission,
    label: carePermissionLabels[permission],
    enabled: canUseCarePermission(access, permission),
    description: carePermissionDescriptions[permission],
  }));
}

export function summarizeCarePermissionAccess(access: CarePermissionContext) {
  const matrix = buildCarePermissionMatrix(access);
  const enabled = matrix.filter((item) => item.enabled);
  const disabled = matrix.filter((item) => !item.enabled);

  return {
    total: matrix.length,
    enabled: enabled.length,
    disabled: disabled.length,
    enabledLabels: enabled.map((item) => item.label),
    disabledLabels: disabled.map((item) => item.label),
  };
}
