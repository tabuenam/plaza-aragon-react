import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/static";
import type { LeaseWithRelations, Payment, Space, Tenant } from "@/lib/types";

export async function getPublicSpaces(): Promise<Space[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("spaces")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as Space[];
  } catch {
    return [];
  }
}

export async function getTenantLeaseWithSpace(tenantId: string): Promise<LeaseWithRelations | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leases")
    .select("*, space:spaces(id, name), tenant:tenants(id, name, contact_info)")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as LeaseWithRelations;
}

export async function getTenantPayments(leaseId: string): Promise<Payment[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("lease_id", leaseId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Payment[];
}

export type AdminPayment = Payment & {
  lease: {
    id: string;
    space: Pick<Space, "id" | "name">;
    tenant: Pick<Tenant, "id" | "name" | "contact_info">;
  };
  signed_receipt_url?: string;
};

export async function getAllSpacesWithActiveLease(): Promise<
  (Space & { current_lease?: { tenant: Pick<Tenant, "name" | "contact_info">; monthly_rent: number } | null })[]
> {
  const supabase = await createSupabaseServerClient();
  const { data: spaces } = await supabase
    .from("spaces")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!spaces) return [];

  const { data: leases } = await supabase
    .from("leases")
    .select("space_id, monthly_rent, tenant:tenants(name, contact_info)")
    .eq("active", true);

  const leaseMap = new Map();
  if (leases) {
    for (const lease of leases) {
      leaseMap.set(lease.space_id, {
        tenant: lease.tenant as unknown as Pick<Tenant, "name" | "contact_info">,
        monthly_rent: lease.monthly_rent,
      });
    }
  }

  return spaces.map((s) => ({
    ...s,
    current_lease: leaseMap.get(s.id) ?? null,
  })) as (Space & { current_lease?: { tenant: Pick<Tenant, "name" | "contact_info">; monthly_rent: number } | null })[];
}

export async function getAdminPayments(year?: number, month?: number): Promise<AdminPayment[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("payments")
    .select("*, lease:leases(id, space:spaces(id, name), tenant:tenants(id, name, contact_info))")
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (year) query = query.eq("period_year", year);
  if (month) query = query.eq("period_month", month);

  const { data, error } = await query;
  if (error || !data) return [];

  const payments = data as unknown as AdminPayment[];

  const paths = payments.map((p) => p.receipt_path).filter(Boolean);
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("receipts").createSignedUrls(paths, 3600);
    if (signedUrls) {
      const urlMap = new Map<string, string>();
      for (const item of signedUrls) {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl);
        }
      }
      for (const p of payments) {
        p.signed_receipt_url = urlMap.get(p.receipt_path) ?? undefined;
      }
    }
  }

  return payments;
}

export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
