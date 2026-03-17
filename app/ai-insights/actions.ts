"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/session";
import { generatePatientHealthInsight } from "@/lib/ai-health";

export async function generateOwnAiInsightAction() {
  const actor = await requireUser();

  try {
    await generatePatientHealthInsight({
      ownerUserId: actor.id,
      actorUserId: actor.id,
    });

    revalidatePath("/ai-insights");
    revalidatePath("/dashboard");
    redirect("/ai-insights?success=1");
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("quota") ||
      message.includes("billing") ||
      message.includes("429")
    ) {
      redirect("/ai-insights?error=quota");
    }

    redirect("/ai-insights?error=general");
  }
}