"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/session";
import { generatePatientHealthInsight } from "@/lib/ai-health";

export async function generateOwnAiInsightAction() {
  const actor = await requireUser();

  await generatePatientHealthInsight({
    ownerUserId: actor.id,
    actorUserId: actor.id,
  });

  revalidatePath("/ai-insights");
  revalidatePath("/dashboard");
}