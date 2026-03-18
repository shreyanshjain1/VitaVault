"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerAccess } from "@/lib/access";
import { requireUser } from "@/lib/session";
import { alertStatusActionSchema } from "@/lib/validations";
import { updateAlertStatus } from "@/lib/alerts/service";

export async function changeAlertStatus(formData: FormData) {
  const currentUser = await requireUser();

  const parsed = alertStatusActionSchema.parse({
    alertId: formData.get("alertId"),
    status: formData.get("status"),
    note: formData.get("note"),
    ownerUserId: formData.get("ownerUserId"),
  });

  await requireOwnerAccess(currentUser.id!, parsed.ownerUserId, "alerts");

  await updateAlertStatus({
    ownerUserId: parsed.ownerUserId,
    actorUserId: currentUser.id!,
    alertId: parsed.alertId,
    status: parsed.status,
    note: parsed.note || null,
  });

  revalidatePath(`/alerts?ownerUserId=${parsed.ownerUserId}`);
  revalidatePath(`/alerts/${parsed.alertId}?ownerUserId=${parsed.ownerUserId}`);
}
