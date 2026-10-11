"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export async function createLeaseAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const spaceId = String(formData.get("space_id") ?? "");
  const tenantId = String(formData.get("tenant_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const monthlyRent = Number(formData.get("monthly_rent"));

  if (!spaceId || !tenantId || !startDate || !endDate) {
    return { ok: false, message: "Todos los campos del contrato son obligatorios." };
  }

  if (isNaN(monthlyRent) || monthlyRent <= 0) {
    return { ok: false, message: "La renta mensual debe ser un monto mayor a 0." };
  }

  if (endDate <= startDate) {
    return { ok: false, message: "La fecha de finalización debe ser posterior a la fecha de inicio." };
  }

  const supabase = user.supabase;

  const { data: existingActive } = await supabase
    .from("leases")
    .select("id")
    .eq("space_id", spaceId)
    .eq("active", true)
    .maybeSingle();

  if (existingActive) {
    return {
      ok: false,
      message: "Este local ya tiene un contrato activo vigente. Finalice el contrato previo antes de crear uno nuevo.",
    };
  }

  const leaseId = crypto.randomUUID();
  const contractFiles = formData.getAll("contract_files") as File[];
  const uploadedPaths: string[] = [];
  const adminClient = createSupabaseAdminClient();

  for (const file of contractFiles) {
    if (file && file.size > 0 && typeof file.arrayBuffer === "function") {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "pdf", "heic", "heif"].includes(fileExt)
        ? fileExt
        : "jpg";
      const cleanBaseName =
        file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 40) || "doc";
      const filePath = `${leaseId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${cleanBaseName}.${safeExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const contentType = file.type || (safeExt === "pdf" ? "application/pdf" : "image/jpeg");

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        const { error: adminUploadError } = await adminClient.storage
          .from("contracts")
          .upload(filePath, fileBuffer, {
            contentType,
            upsert: false,
          });
        if (!adminUploadError) {
          uploadedPaths.push(filePath);
        }
      } else {
        uploadedPaths.push(filePath);
      }
    }
  }

  const { error: leaseError } = await supabase.from("leases").insert({
    id: leaseId,
    space_id: spaceId,
    tenant_id: tenantId,
    start_date: startDate,
    end_date: endDate,
    monthly_rent: monthlyRent,
    active: true,
    contract_files: uploadedPaths,
  });

  if (leaseError) {
    if (uploadedPaths.length > 0) {
      await adminClient.storage.from("contracts").remove(uploadedPaths);
    }
    return { ok: false, message: "Error al registrar el contrato de arrendamiento." };
  }

  await supabase.from("spaces").update({ status: "occupied" }).eq("id", spaceId);

  revalidatePath("/admin");
  revalidatePath("/admin/contratos");
  revalidatePath("/");
  revalidatePath("/portal");

  return { ok: true, message: "Contrato creado exitosamente y disponibilidad del local actualizada a ocupado." };
}

export async function updateLeaseAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const leaseId = String(formData.get("lease_id") ?? "");
  const spaceId = String(formData.get("space_id") ?? "");
  const tenantId = String(formData.get("tenant_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const monthlyRent = Number(formData.get("monthly_rent"));
  const active = formData.get("active") === "true" || formData.get("active") === "on";

  if (!leaseId || !spaceId || !tenantId || !startDate || !endDate) {
    return { ok: false, message: "Todos los campos del contrato son obligatorios." };
  }

  if (isNaN(monthlyRent) || monthlyRent <= 0) {
    return { ok: false, message: "La renta mensual debe ser un monto mayor a 0." };
  }

  if (endDate <= startDate) {
    return { ok: false, message: "La fecha de finalización debe ser posterior a la fecha de inicio." };
  }

  const supabase = user.supabase;

  const { data: currentLease } = await supabase
    .from("leases")
    .select("space_id, active")
    .eq("id", leaseId)
    .single();

  if (!currentLease) {
    return { ok: false, message: "El contrato no existe." };
  }

  if (active) {
    const { data: otherActive } = await supabase
      .from("leases")
      .select("id")
      .eq("space_id", spaceId)
      .eq("active", true)
      .neq("id", leaseId)
      .maybeSingle();

    if (otherActive) {
      return { ok: false, message: "El local seleccionado ya tiene otro contrato activo." };
    }
  }

  const existingFilesRaw = String(formData.get("existing_contract_files") ?? "[]");
  let finalContractFiles: string[] = [];
  try {
    finalContractFiles = JSON.parse(existingFilesRaw);
  } catch {
    finalContractFiles = [];
  }

  const newContractFiles = formData.getAll("new_contract_files") as File[];
  const adminClient = createSupabaseAdminClient();

  for (const file of newContractFiles) {
    if (file && file.size > 0 && typeof file.arrayBuffer === "function") {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "pdf", "heic", "heif"].includes(fileExt)
        ? fileExt
        : "jpg";
      const cleanBaseName =
        file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 40) || "doc";
      const filePath = `${leaseId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${cleanBaseName}.${safeExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const contentType = file.type || (safeExt === "pdf" ? "application/pdf" : "image/jpeg");

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        const { error: adminUploadError } = await adminClient.storage
          .from("contracts")
          .upload(filePath, fileBuffer, {
            contentType,
            upsert: false,
          });
        if (!adminUploadError) {
          finalContractFiles.push(filePath);
        }
      } else {
        finalContractFiles.push(filePath);
      }
    }
  }

  const { error: updateError } = await supabase
    .from("leases")
    .update({
      space_id: spaceId,
      tenant_id: tenantId,
      start_date: startDate,
      end_date: endDate,
      monthly_rent: monthlyRent,
      active,
      contract_files: finalContractFiles,
    })
    .eq("id", leaseId);

  if (updateError) {
    return { ok: false, message: "Error al actualizar el contrato." };
  }

  if (!active && currentLease.active) {
    await supabase.from("spaces").update({ status: "available" }).eq("id", currentLease.space_id);
  } else if (active && !currentLease.active) {
    await supabase.from("spaces").update({ status: "occupied" }).eq("id", spaceId);
  } else if (active && currentLease.space_id !== spaceId) {
    await supabase.from("spaces").update({ status: "available" }).eq("id", currentLease.space_id);
    await supabase.from("spaces").update({ status: "occupied" }).eq("id", spaceId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/contratos");
  revalidatePath("/");
  revalidatePath("/portal");

  return { ok: true, message: "Contrato actualizado exitosamente." };
}

export async function terminateLeaseAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const leaseId = String(formData.get("lease_id") ?? "");

  if (!leaseId) {
    return { ok: false, message: "Identificador de contrato no proporcionado." };
  }

  const supabase = user.supabase;
  const { data: lease } = await supabase
    .from("leases")
    .select("space_id, active")
    .eq("id", leaseId)
    .single();

  if (!lease) {
    return { ok: false, message: "El contrato no fue encontrado." };
  }

  const { error } = await supabase
    .from("leases")
    .update({ active: false })
    .eq("id", leaseId);

  if (error) {
    return { ok: false, message: "Error al finalizar el contrato." };
  }

  await supabase.from("spaces").update({ status: "available" }).eq("id", lease.space_id);

  revalidatePath("/admin");
  revalidatePath("/admin/contratos");
  revalidatePath("/");
  revalidatePath("/portal");

  return { ok: true, message: "Contrato finalizado exitosamente y disponibilidad del local actualizada a disponible." };
}

export async function createTenantAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const contactInfo = String(formData.get("contact_info") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim() || "PlazaAragon2026!";

  if (!name || !email) {
    return { ok: false, message: "El nombre y el correo electrónico del inquilino son obligatorios." };
  }

  const adminClient = createSupabaseAdminClient();
  const { data: created, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    app_metadata: { role: "tenant" },
    user_metadata: { name },
    email_confirm: true,
  });

  if (authError || !created?.user) {
    return { ok: false, message: authError?.message || "No se pudo crear la cuenta del inquilino." };
  }

  const { error: tenantError } = await adminClient.from("tenants").insert({
    id: created.user.id,
    name,
    contact_info: contactInfo,
  });

  if (tenantError) {
    return { ok: false, message: "Usuario creado, pero hubo un error al guardar los datos del inquilino." };
  }

  revalidatePath("/admin/contratos");
  return { ok: true, message: "Inquilino registrado exitosamente." };
}

