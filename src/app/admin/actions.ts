"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { FormState, SpaceStatus } from "@/lib/types";

export async function verifyPaymentAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const paymentId = String(formData.get("payment_id") ?? "");

  if (!paymentId) return;

  const supabase = user.supabase;
  await supabase
    .from("payments")
    .update({
      status: "verified",
      reviewed_at: new Date().toISOString(),
      admin_note: null,
    })
    .eq("id", paymentId);

  revalidatePath("/admin");
  revalidatePath("/admin/pagos");
  revalidatePath("/admin/historial");
  revalidatePath("/portal");
}

export async function rejectPaymentAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const paymentId = String(formData.get("payment_id") ?? "");
  const adminNote = String(formData.get("admin_note") ?? "").trim();

  if (!paymentId) return;

  const supabase = user.supabase;
  await supabase
    .from("payments")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || "Comprobante rechazado por la administración.",
    })
    .eq("id", paymentId);

  revalidatePath("/admin");
  revalidatePath("/admin/pagos");
  revalidatePath("/admin/historial");
  revalidatePath("/portal");
}

export async function updateSpaceStatusAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const spaceId = String(formData.get("space_id") ?? "");
  const status = String(formData.get("status") ?? "") as SpaceStatus;
  const price = Number(formData.get("price"));

  if (!spaceId || !["available", "occupied", "construction"].includes(status)) {
    return { ok: false, message: "Datos del local inválidos." };
  }

  const supabase = user.supabase;
  const { error } = await supabase
    .from("spaces")
    .update({ status, price: price > 0 ? price : undefined })
    .eq("id", spaceId);

  if (error) {
    return { ok: false, message: "No se pudo actualizar el estado del local." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "Estado del local actualizado correctamente." };
}
