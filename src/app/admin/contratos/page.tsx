import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminTenants, getAllLeases, getAllSpaces } from "@/lib/data";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { deleteLeaseAction, deleteTenantAction } from "@/app/admin/actions";
import { CollapsibleSection } from "@/app/admin/contratos/collapsible-section";
import { ConfirmDeleteButton } from "@/app/admin/contratos/confirm-delete-button";
import { CreateLeaseModal } from "@/app/admin/contratos/create-lease-modal";
import { EditLeaseModal } from "@/app/admin/contratos/edit-lease-modal";
import { TerminateLeaseButton } from "@/app/admin/contratos/terminate-lease-button";
import { CreateTenantModal } from "@/app/admin/contratos/create-tenant-modal";
import { EditTenantModal } from "@/app/admin/contratos/edit-tenant-modal";
import { ContractAttachmentsView } from "@/components/contract-attachments-view";

export const metadata: Metadata = {
  title: "Contratos de Arrendamiento",
  description: "Administración de inquilinos y contratos de arrendamiento en Plaza Aragón.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/* Responsive table: regular table from md up, stacked cards below (labels shown via CellLabel). */
const tableClass = "w-full text-left text-sm max-md:block";
const theadClass = "max-md:hidden bg-arena/60 text-xs font-semibold uppercase tracking-wider text-piedra";
const thClass = "px-4 py-3 font-semibold";
const tbodyClass = "max-md:block max-md:space-y-3 max-md:p-3 md:divide-y md:divide-crema/70";
const trClass = "align-top max-md:block max-md:rounded-2xl max-md:border max-md:border-crema max-md:p-4";
const cellClass =
  "max-md:flex max-md:items-start max-md:justify-between max-md:gap-3 max-md:py-1.5 md:px-4 md:py-3";
const rowHeaderClass = `${cellClass} max-md:mb-1 max-md:border-b max-md:border-crema/70 max-md:pb-2 font-normal`;
const actionsCellClass = `${cellClass} max-md:mt-2 max-md:border-t max-md:border-crema/70 max-md:pt-3`;

function CellLabel({ children }: { children: string }) {
  return <span className="shrink-0 text-xs font-semibold uppercase text-piedra md:hidden">{children}</span>;
}

export default async function AdminContratosPage(props: { searchParams: SearchParams }) {
  await connection();
  await requireAdmin();

  const searchParams = await props.searchParams;
  const filterEstado = typeof searchParams.estado === "string" ? searchParams.estado : "todos";

  const [leases, spaces, tenants] = await Promise.all([getAllLeases(), getAllSpaces(), getAdminTenants()]);

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

  const leasesByTenant = new Map<string, typeof leases>();
  for (const lease of leases) {
    const list = leasesByTenant.get(lease.tenant_id) ?? [];
    list.push(lease);
    leasesByTenant.set(lease.tenant_id, list);
  }

  const filters = [
    { key: "todos", label: "Todos", count: leases.length },
    { key: "activos", label: "Vigentes", count: activeLeases.length },
    { key: "terminados", label: "Terminados", count: terminatedLeases.length },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-azul sm:text-3xl">Contratos de Arrendamiento</h1>
        <p className="mt-1 text-sm text-piedra">
          Administre inquilinos y contratos: cree, modifique, termine o elimine registros.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Contratos Vigentes</p>
          <p className="mt-2 font-display text-2xl font-bold text-azul sm:text-3xl">{activeLeases.length}</p>
          <p className="mt-1 text-xs text-piedra">De {spaces.length} locales totales</p>
        </div>

        <div className="card bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-piedra">Renta Comprometida</p>
          <p className="mt-2 font-display text-xl font-bold text-selva sm:text-2xl">
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
          <p className="mt-2 font-display text-2xl font-bold text-azul sm:text-3xl">{tenants.length}</p>
          <p className="mt-1 text-xs text-piedra">{terminatedLeases.length} contratos históricos</p>
        </div>
      </section>

      {/* ───────────── Inquilinos ───────────── */}
      <CollapsibleSection
        title="Inquilinos"
        count={tenants.length}
        description="Cuentas de acceso al portal y datos de contacto de los arrendatarios."
      >
        <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-6">
          <CreateTenantModal />
        </div>

        {tenants.length === 0 ? (
          <p className="border-t border-crema px-6 py-10 text-center text-sm text-piedra">
            No hay inquilinos registrados. Registre uno para poder crear contratos.
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-crema">
            <table className={tableClass}>
              <caption className="sr-only">Inquilinos registrados</caption>
              <thead className={theadClass}>
                <tr>
                  <th scope="col" className={thClass}>Inquilino</th>
                  <th scope="col" className={thClass}>Correo</th>
                  <th scope="col" className={thClass}>Contacto</th>
                  <th scope="col" className={thClass}>Contratos</th>
                  <th scope="col" className={`${thClass} text-right`}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {tenants.map((tenant) => {
                  const tenantLeases = leasesByTenant.get(tenant.id) ?? [];
                  const tenantActive = tenantLeases.filter((l) => l.active);
                  const tenantHistoric = tenantLeases.length - tenantActive.length;
                  return (
                    <tr key={tenant.id} className={trClass}>
                      <th scope="row" className={rowHeaderClass}>
                        <span className="font-semibold text-azul">{tenant.name}</span>
                      </th>
                      <td className={cellClass}>
                        <CellLabel>Correo</CellLabel>
                        <span className="break-all text-tinta max-md:text-right">
                          {tenant.email ?? <span className="italic text-piedra">Sin cuenta</span>}
                        </span>
                      </td>
                      <td className={cellClass}>
                        <CellLabel>Contacto</CellLabel>
                        <span className="text-tinta">
                          {tenant.contact_info || <span className="italic text-piedra">—</span>}
                        </span>
                      </td>
                      <td className={cellClass}>
                        <CellLabel>Contratos</CellLabel>
                        <div className="flex flex-wrap items-center gap-1.5 max-md:justify-end">
                          {tenantActive.map((l) => (
                            <span
                              key={l.id}
                              className="rounded-full bg-selva-claro px-2.5 py-0.5 text-xs font-semibold text-selva"
                            >
                              {l.space.name}
                            </span>
                          ))}
                          {tenantHistoric > 0 && (
                            <span className="rounded-full bg-crema px-2.5 py-0.5 text-xs font-semibold text-piedra">
                              {tenantHistoric} terminado(s)
                            </span>
                          )}
                          {tenantLeases.length === 0 && <span className="text-xs italic text-piedra">Ninguno</span>}
                        </div>
                      </td>
                      <td className={actionsCellClass}>
                        <div className="flex w-full flex-wrap items-center justify-end gap-2">
                          <EditTenantModal tenant={tenant} />
                          <ConfirmDeleteButton
                            action={deleteTenantAction}
                            fields={{ tenant_id: tenant.id }}
                            ariaLabel={`Eliminar inquilino ${tenant.name}`}
                            title={`¿Eliminar a ${tenant.name}?`}
                            description={
                              <>
                                Se eliminará su ficha y su cuenta de acceso al portal. Esta acción no se puede
                                deshacer.
                              </>
                            }
                            blockedReason={
                              tenantLeases.length > 0
                                ? `Tiene ${tenantLeases.length} contrato(s) registrado(s). Elimine primero sus contratos en la tabla de contratos.`
                                : undefined
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* ───────────── Contratos ───────────── */}
      <CollapsibleSection
        title="Contratos"
        count={leases.length}
        description="Vigencias, rentas pactadas y documentos de cada arrendamiento."
      >
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <nav aria-label="Filtrar contratos" className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={`/admin/contratos?estado=${f.key}`}
                scroll={false}
                aria-current={filterEstado === f.key ? "page" : undefined}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  filterEstado === f.key
                    ? "bg-azul text-white"
                    : "border border-crema bg-white text-piedra hover:bg-crema/40"
                }`}
              >
                {f.label} ({f.count})
              </Link>
            ))}
          </nav>
          <CreateLeaseModal spaces={spaces} tenants={tenants} activeSpaceIds={activeSpaceIds} />
        </div>

        {displayLeases.length === 0 ? (
          <p className="border-t border-crema px-6 py-10 text-center text-sm text-piedra">
            {filterEstado === "terminados"
              ? "No hay contratos finalizados registrados en el sistema."
              : "No hay contratos que coincidan con este filtro. Cree un nuevo contrato para empezar."}
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-crema">
            <table className={tableClass}>
              <caption className="sr-only">Contratos de arrendamiento</caption>
              <thead className={theadClass}>
                <tr>
                  <th scope="col" className={thClass}>Local</th>
                  <th scope="col" className={thClass}>Inquilino</th>
                  <th scope="col" className={thClass}>Renta</th>
                  <th scope="col" className={thClass}>Período</th>
                  <th scope="col" className={thClass}>Estado</th>
                  <th scope="col" className={thClass}>Documentos</th>
                  <th scope="col" className={`${thClass} text-right`}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {displayLeases.map((lease) => {
                  const daysLeft = daysUntil(lease.end_date);
                  const attachmentCount = lease.attachments?.length ?? 0;
                  const paymentCount = lease.payment_count ?? 0;
                  return (
                    <tr key={lease.id} className={`${trClass} ${lease.active ? "" : "bg-arena/40"}`}>
                      <th scope="row" className={rowHeaderClass}>
                        <span className="block font-semibold text-tinta">{lease.space.name}</span>
                        <span className="block text-xs text-piedra">
                          Base: {formatMoney(lease.space.price)}
                        </span>
                      </th>
                      <td className={cellClass}>
                        <CellLabel>Inquilino</CellLabel>
                        <span className="max-md:text-right">
                          <span className="block font-semibold text-azul">{lease.tenant.name}</span>
                          <span className="block text-xs text-piedra">
                            {lease.tenant.contact_info || "Sin número registrado"}
                          </span>
                        </span>
                      </td>
                      <td className={cellClass}>
                        <CellLabel>Renta</CellLabel>
                        <span className="whitespace-nowrap font-display font-bold text-azul">
                          {formatMoney(lease.monthly_rent)}
                        </span>
                      </td>
                      <td className={cellClass}>
                        <CellLabel>Período</CellLabel>
                        <span className="max-md:text-right">
                          <span className="block whitespace-nowrap text-tinta">
                            {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                          </span>
                          {lease.active && (
                            <span
                              className={`block text-xs font-semibold ${
                                daysLeft < 0 ? "text-barro" : daysLeft < 30 ? "text-maiz" : "text-selva"
                              }`}
                            >
                              {daysLeft < 0
                                ? `Venció hace ${Math.abs(daysLeft)} días`
                                : daysLeft === 0
                                  ? "Vence hoy"
                                  : `Quedan ${daysLeft} días`}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={cellClass}>
                        <CellLabel>Estado</CellLabel>
                        {lease.active ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-selva-claro px-3 py-1 text-xs font-bold text-selva">
                            <span aria-hidden="true">●</span> Vigente
                          </span>
                        ) : (
                          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-crema px-3 py-1 text-xs font-semibold text-piedra">
                            Terminado
                          </span>
                        )}
                      </td>
                      <td className={cellClass}>
                        <CellLabel>Documentos</CellLabel>
                        {attachmentCount === 0 ? (
                          <span className="text-xs italic text-piedra">Sin archivos</span>
                        ) : (
                          <details className="group/docs max-md:text-right">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-azul hover:bg-crema/40 [&::-webkit-details-marker]:hidden">
                              {attachmentCount} archivo(s)
                              <svg
                                className="h-3.5 w-3.5 transition-transform group-open/docs:rotate-180"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="mt-2 min-w-48 text-left">
                              <ContractAttachmentsView attachments={lease.attachments} compact />
                            </div>
                          </details>
                        )}
                      </td>
                      <td className={actionsCellClass}>
                        <div className="flex w-full flex-wrap items-center justify-end gap-2">
                          <EditLeaseModal
                            lease={lease}
                            spaces={spaces}
                            tenants={tenants}
                            activeSpaceIds={activeSpaceIds}
                          />
                          {lease.active && (
                            <TerminateLeaseButton leaseId={lease.id} spaceName={lease.space.name} />
                          )}
                          <ConfirmDeleteButton
                            action={deleteLeaseAction}
                            fields={{ lease_id: lease.id }}
                            ariaLabel={`Eliminar contrato de ${lease.space.name}`}
                            title={`¿Eliminar el contrato de ${lease.space.name}?`}
                            description={
                              <>
                                <p>
                                  Se borrará permanentemente el contrato de <strong>{lease.tenant.name}</strong>
                                  {paymentCount > 0 && (
                                    <>
                                      , junto con <strong className="text-barro">{paymentCount} pago(s)</strong> y
                                      sus comprobantes
                                    </>
                                  )}
                                  {attachmentCount > 0 && <> y {attachmentCount} documento(s) adjunto(s)</>}.
                                  {lease.active && (
                                    <> El local {lease.space.name} quedará <strong className="text-selva">Disponible</strong>.</>
                                  )}
                                </p>
                                <p className="mt-2">
                                  Esta acción no se puede deshacer. Para conservar el historial de pagos use
                                  «Terminar contrato».
                                </p>
                              </>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
