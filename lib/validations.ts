import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

export const healthProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  dateOfBirth: z.string().optional().or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  bloodType: z.string().max(10).optional(),
  heightCm: z.coerce.number().min(0).max(300).optional(),
  weightKg: z.coerce.number().min(0).max(500).optional(),
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(40).optional(),
  chronicConditions: z.string().max(1000).optional(),
  allergiesSummary: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const alertRuleSchema = z
  .object({
    name: z.string().min(3).max(120),
    description: z.string().max(500).optional().or(z.literal("")),
    category: z.enum([
      "VITAL_THRESHOLD",
      "MEDICATION_ADHERENCE",
      "SYMPTOM_SEVERITY",
      "SYNC_HEALTH",
    ]),
    metricKey: z.string().max(80).optional().or(z.literal("")),
    enabled: z.coerce.boolean().default(true),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    visibleToCareTeam: z.coerce.boolean().default(true),
    cooldownMinutes: z.coerce.number().int().min(0).max(10080).default(180),
    lookbackHours: z.coerce.number().int().min(1).max(720).default(24),
    thresholdOperator: z
      .enum(["GT", "GTE", "LT", "LTE", "BETWEEN"])
      .optional(),
    thresholdValue: z.coerce.number().optional(),
    thresholdValueSecondary: z.coerce.number().optional(),
    symptomSeverity: z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
    medicationMissedCount: z.coerce.number().int().min(1).max(30).optional(),
    syncStaleHours: z.coerce.number().int().min(1).max(720).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === "VITAL_THRESHOLD") {
      if (!data.metricKey) {
        ctx.addIssue({
          code: "custom",
          path: ["metricKey"],
          message: "Metric is required for vital threshold rules.",
        });
      }

      if (!data.thresholdOperator) {
        ctx.addIssue({
          code: "custom",
          path: ["thresholdOperator"],
          message: "Threshold operator is required.",
        });
      }

      if (data.thresholdValue == null) {
        ctx.addIssue({
          code: "custom",
          path: ["thresholdValue"],
          message: "Threshold value is required.",
        });
      }

      if (
        data.thresholdOperator === "BETWEEN" &&
        data.thresholdValueSecondary == null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["thresholdValueSecondary"],
          message: "A second value is required for BETWEEN.",
        });
      }
    }

    if (
      data.category === "MEDICATION_ADHERENCE" &&
      data.medicationMissedCount == null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["medicationMissedCount"],
        message: "Missed count is required for medication adherence rules.",
      });
    }

    if (data.category === "SYMPTOM_SEVERITY" && !data.symptomSeverity) {
      ctx.addIssue({
        code: "custom",
        path: ["symptomSeverity"],
        message: "Symptom severity is required.",
      });
    }

    if (data.category === "SYNC_HEALTH" && data.syncStaleHours == null) {
      ctx.addIssue({
        code: "custom",
        path: ["syncStaleHours"],
        message: "Stale sync threshold is required.",
      });
    }
  });

export const alertStatusActionSchema = z.object({
  alertId: z.string().min(1),
  status: z.enum(["ACKNOWLEDGED", "RESOLVED", "DISMISSED"]),
  note: z.string().max(500).optional().or(z.literal("")),
  ownerUserId: z.string().min(1),
});
