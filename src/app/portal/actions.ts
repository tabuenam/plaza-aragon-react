"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { getTenantLeaseWithSpace } from "@/lib/data";
import type { FormState } from "@/lib/types";

export async function submitPaymentAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireTenant();
  const lease = await getTenantLeaseWithSpace(user.id);

  if (!lease) {
    return { ok: false, message: "No se encontró un contrato activo para su usuario." };
  }

  const periodMonth = Number(formData.get("period_month"));
  const periodYear = Number(formData.get("period_year"));
  const amount = Number(formData.get("amount"));
  const receiptFile = formData.get("receipt") as File | null;

  if (!periodMonth || periodMonth < 1 || periodMonth > 12) {
    return { ok: false, message: "Seleccione un mes válido." };
  }

  if (!periodYear || periodYear < 2020 || periodYear > 2100) {
    return { ok: false, message: "Seleccione un año válido." };
  }

  if (!amount || amount <= 0) {
    return { ok: false, message: "Ingrese un monto válido." };
  }

  if (!receiptFile || receiptFile.size === 0) {
    return { ok: false, message: "Debe adjuntar el comprobante de transferencia bancaria." };
  }

  const supabase = user.supabase;

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("lease_id", lease.id)
    .eq("period_year", periodYear)
    .eq("period_month", periodMonth)
    .neq("status", "rejected")
    .maybeSingle();

  if (existingPayment) {
    const estado = existingPayment.status === "verified" ? "ya fue verificado" : "está pendiente de revisión";
    return {
      ok: false,
      message: `Ya existe un pago registrado para este período que ${estado}.`,
    };
  }

  const fileExt = receiptFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(fileExt) ? fileExt : "jpg";
  const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const arrayBuffer = await receiptFile.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage.from("receipts").upload(filePath, fileBuffer, {
    contentType: receiptFile.type || "image/jpeg",
    upsert: false,
  });

  if (uploadError) {
    return {
      ok: false,
      message: "No se pudo subir la imagen del comprobante. Intente de nuevo.",
    };
  }

  const { error: insertError } = await supabase.from("payments").insert({
    lease_id: lease.id,
    amount,
    period_month: periodMonth,
    period_year: periodYear,
    receipt_path: filePath,
    status: "pending",
  });

  if (insertError) {
    await supabase.storage.from("receipts").remove([filePath]);
    return {
      ok: false,
      message: "Error al guardar el pago en el sistema. Intente de nuevo.",
    };
  }

  revalidatePath("/portal");
  return {
    ok: true,
    message: "Comprobante enviado exitosamente. La administración lo revisará a la brevedad.",
  };
}
