import { z } from "zod";
export const signupSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8).max(64) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(64) });
export const healthProfileSchema = z.object({
  fullName: z.string().min(2).max(120), dateOfBirth: z.string().optional().or(z.literal("")),
  sex: z.enum(["MALE","FEMALE","OTHER","PREFER_NOT_TO_SAY"]).optional(),
  bloodType: z.string().max(10).optional(), heightCm: z.coerce.number().min(0).max(300).optional(),
  weightKg: z.coerce.number().min(0).max(500).optional(), emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(40).optional(), chronicConditions: z.string().max(1000).optional(),
  allergiesSummary: z.string().max(1000).optional(), notes: z.string().max(2000).optional()
});
