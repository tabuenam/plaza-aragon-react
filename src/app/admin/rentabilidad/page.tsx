import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getModuleProfitabilityOverview } from "@/lib/data";
import { ProfitabilityDashboard } from "@/app/admin/rentabilidad/profitability-dashboard";

export const metadata: Metadata = {
  title: "Rentabilidad y Gastos",
  description:
    "Control de inversión, gastos operativos, financiamiento y rentabilidad por módulo comercial en Plaza Aragón.",
};

function AdminRentabilidadSkeleton() {
  return (
    <div
      className="space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Cargando rentabilidad y gastos…"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-48 rounded bg-crema/70" />
          <div className="h-8 w-64 rounded-lg bg-crema/80" />
          <div className="h-4 w-80 max-w-full rounded bg-crema/60" />
        </div>
        <div className="h-10 w-44 rounded-xl bg-crema/70" />
      </div>

      <section className="card border border-azul/15 bg-white">
        <div className="flex flex-col gap-4 border-b border-crema pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-3 w-44 rounded bg-crema/70" />
            <div className="h-6 w-72 max-w-full rounded bg-crema/80" />
          </div>
          <div className="h-9 w-52 rounded-2xl bg-arena" />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-crema bg-arena/40 p-4 space-y-2">
              <div className="h-3 w-28 rounded bg-crema/70" />
              <div className="h-7 w-32 rounded bg-crema/80" />
              <div className="h-3 w-36 rounded bg-crema/60" />
            </div>
          ))}
        </div>
        <div className="mt-5 h-3 w-full rounded-full bg-crema/70" />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-crema/80" />
                <div className="h-3.5 w-28 rounded bg-crema/60" />
              </div>
              <div className="h-7 w-24 rounded-full bg-arena" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((__, metricIndex) => (
                <div key={metricIndex} className="rounded-xl bg-arena/50 p-3 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-crema/70" />
                  <div className="h-5 w-24 rounded bg-crema/80" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function AdminRentabilidadContent() {
  await requireAdmin();
  const { summary, modules } = await getModuleProfitabilityOverview();

  return <ProfitabilityDashboard summary={summary} modules={modules} />;
}

export default function AdminRentabilidadPage() {
  return (
    <Suspense fallback={<AdminRentabilidadSkeleton />}>
      <AdminRentabilidadContent />
    </Suspense>
  );
}
