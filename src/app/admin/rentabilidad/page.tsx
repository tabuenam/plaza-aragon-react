import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getModuleProfitabilityOverview } from "@/lib/data";
import { ProfitabilityDashboard } from "@/app/admin/rentabilidad/profitability-dashboard";

export const metadata: Metadata = {
  title: "Rentabilidad y Gastos",
  description:
    "Control de inversión, gastos operativos, financiamiento y rentabilidad por módulo comercial en Plaza Aragón.",
};

export default async function AdminRentabilidadPage() {
  await connection();
  await requireAdmin();

  const { summary, modules } = await getModuleProfitabilityOverview();

  return <ProfitabilityDashboard summary={summary} modules={modules} />;
}
