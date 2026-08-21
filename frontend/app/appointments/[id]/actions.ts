"use server";

import { revalidatePath } from "next/cache";

import { updateAppointmentOutcome } from "@/lib/api";

export async function recordOutcomeAction(appointmentId: string, noShow: boolean) {
  await updateAppointmentOutcome(appointmentId, noShow);
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/");
  revalidatePath("/analytics");
}
