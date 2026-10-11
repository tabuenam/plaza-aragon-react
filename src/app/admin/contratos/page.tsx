import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllLeases, getAllSpaces, getAllTenants } from "@/lib/data";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { CreateLeaseModal } from "@/components/create-lease-modal";
import { EditLeaseModal } from "@/components/edit-lease-modal";
import { TerminateLeaseButton } from "@/components/terminate-lease-button";
import { CreateTenantModal } from "@/components/create-tenant-modal";

export const metadata: Metadata = {
  title: "Contratos de Arrendamiento",
  description: "Administración, modificación y terminación de contratos en Plaza Aragón.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminContratosPage(props: { searchParams: SearchParams }) {
  await connection();
  await requireAdmin();

  const searchParams = await props.searchParams;
  const filterEstado = typeof searchParams.estado === "string" ? searchParams.estado : "todos";

  const leases = await getAllLeases();
  const spaces = await getAllSpaces();
  const tenants = await getAllTenants();

  const activeLeases = leases.filter((l) => l.active);
  const terminatedLeases = leases.filter((l) => !l.active);
  const activeSpaceIds = activeLeases.map((l) => l.space_id);

  const availableSpacesCount = spaces.filter((s) => s.status === "available").length;
  const committedIncome = activeLeases.reduce((acc, l) => acc + Number(l.monthly_rent), 0);

  const displayLeases = leases.filter((l) => {
    if (filterEstado === "activos") return l.active;
    if (filterEstado === "terminados") return !l.active;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-azul sm:text-3xl">
            Contratos de Arrendamiento
          </h1>
          <p className="mt-1 text-sm text-piedra">
            Configure los detalles de los alquileres, modifique vigencias o termine contratos existentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CreateTenantModal />
          <CreateLeaseModal
            spaces={spaces}
            tenants={tenants}
            activeSpaceIds={activeSpaceIds}
          />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Contratos Vigentes</p>
          <p className="mt-2 font-display text-2xl font-bold text-azul sm:text-3xl">{activeLeases.length}</p>
          <p className="mt-1 text-xs text-piedra">De {spaces.length} locales totales</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Renta Comprometida</p>
          <p className="mt-2 font-display text-xl font-bold text-selsm sm:text-2xl text-selva">
            {formatMoney(committedIncome)}
          </p>
          <p className="mt-1 text-xs text-piedra">Ingreso mensual proyectado</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Locales Disponibles</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#7a5410] sm:text-3xl">
            {availableSpacesCount}
          </p>
          <p className="mt-1 text-xs text-piedra">Listos para nuevo contrato</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Inquilinos Registrados</p>
          <p className="mt-2 font-display text-2xl font-bold text-azul sm:text-3xl">
            {tenants.length}
          </p>
          <p className="mt-1 text-xs text-piedra">{terminatedLeases.length} contratos históricos</p>
        </div>
      </section>

      <div className="flex items-center gap-2 border-b border-crema pb-2">
        <Link
          href="/admin/contratos?estado=todos"
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filterEstado === "todos"
              ? "bg-azul text-white"
              : "bg-white text-piedra border border-crema hover:bg-crema/40"
          }`}
        >
          Todos ({leases.length})
        </Link>
        <Link
          href="/admin/contratos?estado=activos"
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filterEstado === "activos"
              ? "bg-azul text-white"
              : "bg-white text-piedra border border-crema hover:bg-crema/40"
          }`}
        >
          Vigentes ({activeLeases.length})
        </Link>
        <Link
          href="/admin/contratos?estado=terminados"
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            filterEstado === "terminados"
              ? "bg-azul text-white"
              : "bg-white text-piedra border border-crema hover:bg-crema/40"
          }`}
        >
          Terminados ({terminatedLeases.length})
        </Link>
      </div>

      {displayLeases.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-arena text-piedra font-bold text-xl">
            📄
          </div>
          <h2 className="mt-3 font-display text-lg font-bold text-azul">No se encontraron contratos</h2>
          <p className="mt-1 text-sm text-piedra max-w-sm mx-auto">
            {filterEstado === "terminados"
              ? "No hay contratos finalizados registrados en el sistema."
              : "No hay contratos que coincidan con este filtro. Cree un nuevo contrato para empezar."}
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {displayLeases.map((lease) => {
            const daysLeft = daysUntil(lease.end_date);
            return (
              <div
                key={lease.id}
                className={`flex flex-col justify-between rounded-3xl border p-5 transition hover:shadow-sm ${
                  lease.active
                    ? "border-crema bg-white"
                    : "border-crema/70 bg-arena/30 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-bold text-tinta">{lease.space.name}</h2>
                        <StatusBadge status={lease.space.status} />
                      </div>
                      <p className="mt-1 text-xs text-piedra">
                        Precio base publicado: {formatMoney(lease.space.price)}
                      </p>
                    </div>

                    <div>
                      {lease.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-selva-claro px-3 py-1 text-xs font-bold text-selva">
                          ● Vigente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-crema px-3 py-1 text-xs font-semibold text-piedra">
                          Terminado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-crema/80 bg-arena/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-piedra">Arrendatario</span>
                      <span className="font-semibold text-sm text-azul">{lease.tenant.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-piedra">Contacto</span>
                      <span className="text-xs font-medium text-tinta">
                        {lease.tenant.contact_info || "Sin número registrado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-crema/60 pt-2">
                      <span className="text-xs font-semibold uppercase text-piedra">Renta pactada</span>
                      <span className="font-display text-lg font-bold text-azul">
                        {formatMoney(lease.monthly_rent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-piedra">
                    <div className="flex items-center justify-between">
                      <span>Período de contrato:</span>
                      <span className="font-semibold text-tinta">
                        {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                      </span>
                    </div>

                    {lease.active && (
                      <div className="flex items-center justify-between">
                        <span>Estado de vigencia:</span>
                        <span
                          className={`font-semibold ${
                            daysLeft < 0
                              ? "text-barro"
                              : daysLeft < 30
                              ? "text-maiz"
                              : "text-selva"
                          }`}
                        >
                          {daysLeft < 0
                            ? `Venció hace ${Math.abs(daysLeft)} días`
                            : daysLeft === 0
                            ? "Vence hoy"
                            : `Quedan ${daysLeft} días`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-crema/60 pt-4">
                  <EditLeaseModal
                    lease={lease}
                    spaces={spaces}
                    tenants={tenants}
                    activeSpaceIds={activeSpaceIds}
                  />

                  {lease.active && (
                    <TerminateLeaseButton
                      leaseId={lease.id}
                      spaceName={lease.space.name}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
