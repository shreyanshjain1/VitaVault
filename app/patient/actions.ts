"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/session";
import { requireOwnerAccess } from "@/lib/access";
import { generatePatientHealthInsight } from "@/lib/ai-health";

export async function generatePatientInsightAction(formData: FormData) {
  const actor = await requireUser();
  const ownerUserId = String(formData.get("ownerUserId") || "").trim();

  if (!ownerUserId) {
    throw new Error("Owner user ID is required.");
  }

  await requireOwnerAccess(actor.id, ownerUserId, "ai");
  await generatePatientHealthInsight({
    ownerUserId,
    actorUserId: actor.id,
  });

  revalidatePath(`/patient/${ownerUserId}`);
}