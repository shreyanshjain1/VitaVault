"use server";

import { revalidatePath } from "next/cache";

export async function changeAlertStatus() {
  revalidatePath("/alerts");
}