import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/static";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { AdminLease, AdminTenant, LeaseWithRelations, Payment, Space, Tenant } from "@/lib/types";

export async function getPublicSpaces(): Promise<Space[]> {
  "use cache";
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
  const lease = data as unknown as LeaseWithRelations;

  const files = Array.isArray(lease.contract_files) ? lease.contract_files : [];
  const paths = files.filter((p) => p && !p.startsWith("http://") && !p.startsWith("https://"));

  const urlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("contracts").createSignedUrls(paths, 3600);
    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl);
        }
      }
    }
  }

  lease.attachments = files.map((path) => {
    const url = urlMap.get(path) || path;
    const rawName = path.split("/").pop() || "contrato";
    const name = rawName.replace(/^\d+-/, "");
    const isPdf = path.toLowerCase().endsWith(".pdf");
    return { path, url, name, isPdf };
  });

  return lease;
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
  const [{ data: spaces }, { data: leases }] = await Promise.all([
    supabase.from("spaces").select("*").order("sort_order", { ascending: true }),
    supabase.from("leases").select("space_id, monthly_rent, tenant:tenants(name, contact_info)").eq("active", true),
  ]);

  if (!spaces) return [];

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

export async function getContractSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from("contracts").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function getAllLeases(): Promise<AdminLease[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leases")
    .select(
      "*, space:spaces(id, name, status, price), tenant:tenants(id, name, contact_info), payments(count)"
    )
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const leases = (data as unknown as (AdminLease & { payments?: { count: number }[] })[]).map(
    ({ payments, ...lease }) => ({
      ...lease,
      payment_count: payments?.[0]?.count ?? 0,
    })
  ) as AdminLease[];

  const allPaths: string[] = [];
  for (const lease of leases) {
    if (Array.isArray(lease.contract_files)) {
      for (const p of lease.contract_files) {
        if (p && !p.startsWith("http://") && !p.startsWith("https://")) {
          allPaths.push(p);
        }
      }
    }
  }

  const urlMap = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("contracts").createSignedUrls(allPaths, 3600);
    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl);
        }
      }
    }
  }

  for (const lease of leases) {
    const files = Array.isArray(lease.contract_files) ? lease.contract_files : [];
    lease.attachments = files.map((path) => {
      const url = urlMap.get(path) || path;
      const rawName = path.split("/").pop() || "contrato";
      const name = rawName.replace(/^\d+-/, "");
      const isPdf = path.toLowerCase().endsWith(".pdf");
      return { path, url, name, isPdf };
    });
  }

  return leases;
}

export async function getAllTenants(): Promise<Tenant[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as Tenant[];
}

/**
 * Tenants plus their login email. Emails live in `auth.users`, which RLS cannot
 * expose, so they are read with the service-role client. Admin pages only.
 */
export async function getAdminTenants(): Promise<AdminTenant[]> {
  await requireAdmin();
  const tenants = await getAllTenants();
  if (tenants.length === 0) return [];

  const emailById = new Map<string, string>();
  const adminClient = createSupabaseAdminClient();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) {
      if (u.email) emailById.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
  }

  return tenants.map((t) => ({ ...t, email: emailById.get(t.id) ?? null }));
}

export async function getAllSpaces(): Promise<Space[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as Space[];
}
