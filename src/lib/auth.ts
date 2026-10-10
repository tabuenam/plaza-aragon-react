import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  return {
    id: claims.sub,
    email: claims.email ?? "",
    isAdmin: claims.app_metadata?.role === "admin",
    supabase,
  };
});

export async function requireUser() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  return user;
}

export async function requireTenant() {
  const user = await requireUser();
  if (user.isAdmin) redirect("/admin");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/portal");
  return user;
}
