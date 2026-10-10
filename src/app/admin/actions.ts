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

export async function updateSpaceAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const spaceId = String(formData.get("space_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "") as SpaceStatus;
  const price = Number(formData.get("price"));
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!spaceId || !name) {
    return { ok: false, message: "El nombre del local es obligatorio." };
  }

  if (!["available", "occupied", "construction"].includes(status)) {
    return { ok: false, message: "El estado del local seleccionado no es válido." };
  }

  if (isNaN(price) || price < 0) {
    return { ok: false, message: "El precio mensual debe ser un número mayor o igual a 0." };
  }

  const existingImagesRaw = String(formData.get("existing_images") ?? "[]");
  let finalImageUrls: string[] = [];
  try {
    finalImageUrls = JSON.parse(existingImagesRaw);
  } catch {
    finalImageUrls = [];
  }

  const supabase = user.supabase;
  const newImages = formData.getAll("new_images") as File[];

  for (const file of newImages) {
    if (file && file.size > 0 && typeof file.arrayBuffer === "function") {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(fileExt) ? fileExt : "jpg";
      const filePath = `${spaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage.from("spaces").upload(filePath, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("spaces").getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          finalImageUrls.push(publicUrlData.publicUrl);
        }
      }
    }
  }

  const { error } = await supabase
    .from("spaces")
    .update({
      name,
      description,
      price,
      status,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      image_urls: finalImageUrls,
    })
    .eq("id", spaceId);

  if (error) {
    return { ok: false, message: "Error al actualizar los datos del local." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "Local actualizado exitosamente." };
}

