import { z } from "zod";

const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? undefined : trimmed;
      }

      return value;
    },
    schema.optional()
  );

const optionalNumberFromInput = (min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? undefined : Number(trimmed);
      }

      return value;
    },
    z.number().min(min).max(max).optional()
  );

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(64),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(64),
});

export const healthProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: emptyStringToUndefined(z.string()),
  sex: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  bloodType: emptyStringToUndefined(z.string().max(10)),
  heightCm: optionalNumberFromInput(0, 300),
  weightKg: optionalNumberFromInput(0, 500),
  emergencyContactName: emptyStringToUndefined(z.string().max(120)),
  emergencyContactPhone: emptyStringToUndefined(z.string().max(40)),
  chronicConditions: emptyStringToUndefined(z.string().max(1000)),
  allergiesSummary: emptyStringToUndefined(z.string().max(1000)),
  notes: emptyStringToUndefined(z.string().max(2000)),
});

export const alertRuleSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: emptyStringToUndefined(z.string().max(500)),
    category: z.enum([
      "VITAL_THRESHOLD",
      "MEDICATION_ADHERENCE",
      "SYMPTOM_SEVERITY",
      "SYNC_HEALTH",
    ]),
    metricKey: emptyStringToUndefined(z.string().max(80)),
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
  note: emptyStringToUndefined(z.string().max(500)),
  ownerUserId: z.string().min(1),
});
