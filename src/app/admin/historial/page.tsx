import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayments, type AdminPayment } from "@/lib/data";
import { currentPeriod, formatMoney, MONTHS } from "@/lib/format";
import type { PaymentType } from "@/lib/types";
import {
  SpacePaymentsAccordion,
  type SpaceColorConfig,
  type SpacePaymentGroup,
} from "./space-payments-accordion";

export const metadata: Metadata = {
  title: "Historial Contable",
  description: "Libro histórico de pagos y transferencias en Plaza Aragón.",
};

const SPACE_PALETTE: Record<string, SpaceColorConfig> = {
  azul: {
    key: "azul",
    barClass: "bg-azul",
    dotClass: "bg-azul",
    borderClass: "border-azul/25",
    badgeBgClass: "bg-turquesa-claro/40",
    badgeTextClass: "text-azul",
  },
  selva: {
    key: "selva",
    barClass: "bg-selva",
    dotClass: "bg-selva",
    borderClass: "border-selva/25",
    badgeBgClass: "bg-selva-claro/60",
    badgeTextClass: "text-selva",
  },
  turquesa: {
    key: "turquesa",
    barClass: "bg-turquesa",
    dotClass: "bg-turquesa",
    borderClass: "border-turquesa/25",
    badgeBgClass: "bg-turquesa-claro/50",
    badgeTextClass: "text-azul",
  },
  maiz: {
    key: "maiz",
    barClass: "bg-maiz",
    dotClass: "bg-maiz",
    borderClass: "border-maiz/35",
    badgeBgClass: "bg-maiz-claro/70",
    badgeTextClass: "text-[#734d08]",
  },
  barro: {
    key: "barro",
    barClass: "bg-barro",
    dotClass: "bg-barro",
    borderClass: "border-barro/25",
    badgeBgClass: "bg-barro-claro/60",
    badgeTextClass: "text-barro",
  },
};

const PALETTE_ORDER: SpaceColorConfig[] = [
  SPACE_PALETTE.azul,
  SPACE_PALETTE.selva,
  SPACE_PALETTE.turquesa,
  SPACE_PALETTE.maiz,
  SPACE_PALETTE.barro,
];

function normalizeSpaceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getNamedSpaceColor(spaceName: string): SpaceColorConfig | null {
  const normalized = normalizeSpaceName(spaceName);
  if (normalized.includes("pacura") || normalized.includes("pacora")) {
    return SPACE_PALETTE.azul;
  }
  if (normalized.includes("corozal")) {
    return SPACE_PALETTE.selva;
  }
  return null;
}

function buildSpaceGroups(payments: AdminPayment[]): SpacePaymentGroup[] {
  const map = new Map<
    string,
    {
      spaceId: string;
      spaceName: string;
      sortOrder: number;
      tenantNames: string[];
      verifiedTotal: number;
      verifiedCount: number;
      pendingCount: number;
      rejectedCount: number;
      payments: AdminPayment[];
    }
  >();

  for (const p of payments) {
    const spaceId = p.lease?.space?.id ?? p.lease?.space?.name ?? "unknown";
    const spaceName = p.lease?.space?.name || "Local";
    const sortOrder = p.lease?.space?.sort_order ?? Number.MAX_SAFE_INTEGER;
    const tenantName = p.lease?.tenant?.name?.trim();

    let entry = map.get(spaceId);
    if (!entry) {
      entry = {
        spaceId,
        spaceName,
        sortOrder,
        tenantNames: [],
        verifiedTotal: 0,
        verifiedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        payments: [],
      };
      map.set(spaceId, entry);
    }

    if (tenantName && !entry.tenantNames.includes(tenantName)) {
      entry.tenantNames.push(tenantName);
    }

    if (p.status === "verified") {
      entry.verifiedCount += 1;
      entry.verifiedTotal += Number(p.amount);
    } else if (p.status === "pending") {
      entry.pendingCount += 1;
    } else if (p.status === "rejected") {
      entry.rejectedCount += 1;
    }

    entry.payments.push(p);
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.spaceName.localeCompare(b.spaceName, "es");
  });

  // First pass: assign fixed brand colors to named spaces (Pacura/Pacora -> blue, Corozal -> green).
  const assignedColors = new Map<string, SpaceColorConfig>();
  const usedKeys = new Set<string>();

  for (const group of sorted) {
    const namedColor = getNamedSpaceColor(group.spaceName);
    if (namedColor) {
      assignedColors.set(group.spaceId, namedColor);
      usedKeys.add(namedColor.key);
    }
  }

  // Second pass: assign remaining spaces the next unused palette color.
  let fallbackIndex = 0;
  return sorted.map((group) => {
    let color = assignedColors.get(group.spaceId);
    if (!color) {
      const unused = PALETTE_ORDER.find((c) => !usedKeys.has(c.key));
      if (unused) {
        color = unused;
        usedKeys.add(unused.key);
      } else {
        color = PALETTE_ORDER[fallbackIndex % PALETTE_ORDER.length];
        fallbackIndex += 1;
      }
    }

    return {
      spaceId: group.spaceId,
      spaceName: group.spaceName,
      tenantNames: group.tenantNames,
      color,
      verifiedTotal: group.verifiedTotal,
      verifiedCount: group.verifiedCount,
      pendingCount: group.pendingCount,
      rejectedCount: group.rejectedCount,
      payments: group.payments,
    };
  });
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function AdminHistorialSkeleton() {
  return (
    <div
      className="space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Cargando historial contable…"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-48 rounded bg-crema/70" />
          <div className="h-8 w-72 max-w-full rounded-lg bg-crema/80" />
          <div className="h-4 w-80 max-w-full rounded bg-crema/60" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-28 rounded-xl bg-arena" />
          <div className="h-9 w-36 rounded-xl bg-arena" />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card bg-white p-5 space-y-2">
            <div className="h-3 w-28 rounded bg-crema/70" />
            <div className="h-7 w-32 rounded bg-crema/80" />
            <div className="h-3 w-36 rounded bg-crema/60" />
          </div>
        ))}
      </section>

      <div className="card bg-white p-5 space-y-4">
        <div className="h-5 w-48 rounded bg-crema/80" />
        <div className="grid grid-cols-6 gap-2 pt-4 sm:grid-cols-12">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="h-24 w-full rounded-t-lg bg-crema/70" />
              <div className="h-3 w-6 rounded bg-arena" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card h-16 bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function AdminHistorialPage(props: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminHistorialSkeleton />}>
      <AdminHistorialContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function AdminHistorialContent(props: { searchParams: SearchParams }) {
  await requireAdmin();

  const searchParams = await props.searchParams;
  const cur = currentPeriod();
  const selectedYear = searchParams.ano ? Number(searchParams.ano) : cur.year;
  const selectedType: PaymentType = searchParams.tipo === "electricity" ? "electricity" : "rent";
  const isElectricity = selectedType === "electricity";

  const allYearPayments = await getAdminPayments(selectedYear);
  const rentCount = allYearPayments.filter((p) => (p.payment_type ?? "rent") === "rent").length;
  const electricityCount = allYearPayments.filter((p) => p.payment_type === "electricity").length;

  const payments = allYearPayments.filter((p) => (p.payment_type ?? "rent") === selectedType);
  const spaceGroups = buildSpaceGroups(payments);

  const totalVerified = payments
    .filter((p) => p.status === "verified")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const monthlyTotals = MONTHS.map((name, idx) => {
    const monthNumber = idx + 1;
    const segments = spaceGroups
      .map((group) => {
        const amount = group.payments
          .filter((p) => p.period_month === monthNumber && p.status === "verified")
          .reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          spaceId: group.spaceId,
          spaceName: group.spaceName,
          color: group.color,
          amount,
        };
      })
      .filter((seg) => seg.amount > 0);

    const verifiedSum = segments.reduce((sum, seg) => sum + seg.amount, 0);

    return {
      monthNumber,
      shortName: name.slice(0, 3),
      name,
      verifiedSum,
      segments,
    };
  });

  const maxMonthTotal = Math.max(...monthlyTotals.map((m) => m.verifiedSum), 1);

  const years = [cur.year - 1, cur.year, cur.year + 1];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow">
            {isElectricity
              ? "Control de Energía Eléctrica · Cuenta Separada"
              : "Control Financiero · Renta HNL"}
          </span>
          <h1 className="mt-1 font-display text-2xl font-bold text-azul sm:text-3xl">
            {isElectricity
              ? `Historial de Energía Eléctrica · ${selectedYear}`
              : `Historial Contable de Renta · ${selectedYear}`}
          </h1>
          <p className="mt-1 text-sm text-piedra">
            {isElectricity
              ? "Registro cronológico de recibos de energía eléctrica por módulo (no suma a los ingresos de renta)."
              : "Registro cronológico de cobros e ingresos verificados por arrendamiento."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={`/admin/historial?tipo=${selectedType}&ano=${y}`}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                y === selectedYear
                  ? "bg-azul text-white shadow-2xs"
                  : "bg-white text-piedra border border-crema hover:bg-crema/40"
              }`}
            >
              Año {y}
            </Link>
          ))}
        </div>
      </div>

      {/* ───────────── ACCOUNT CATEGORY SWITCHER ───────────── */}
      <nav
        aria-label="Seleccionar cuenta histórica"
        className="grid grid-cols-1 gap-2 rounded-2xl border border-crema bg-white p-1.5 shadow-2xs sm:grid-cols-2"
      >
        <Link
          href={`/admin/historial?tipo=rent&ano=${selectedYear}`}
          aria-current={!isElectricity ? "page" : undefined}
          className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
            !isElectricity
              ? "bg-azul text-white shadow-xs"
              : "bg-arena/50 text-tinta hover:bg-arena"
          }`}
        >
          <span>Cuenta de Renta Mensual</span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
              !isElectricity ? "bg-white/20 text-white" : "bg-white text-azul ring-1 ring-crema"
            }`}
          >
            {rentCount}
          </span>
        </Link>
        <Link
          href={`/admin/historial?tipo=electricity&ano=${selectedYear}`}
          aria-current={isElectricity ? "page" : undefined}
          className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
            isElectricity
              ? "bg-maiz text-azul-oscuro shadow-xs ring-1 ring-maiz/50"
              : "bg-arena/50 text-tinta hover:bg-arena"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">⚡</span>
            <span>Energía Eléctrica (Separada)</span>
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
              isElectricity
                ? "bg-azul-oscuro/15 text-azul-oscuro"
                : "bg-white text-[#734d08] ring-1 ring-crema"
            }`}
          >
            {electricityCount}
          </span>
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">
            {isElectricity
              ? `Total Reportado en Luz (${selectedYear})`
              : `Total Recaudado Renta (${selectedYear})`}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-selva sm:text-3xl">
            {formatMoney(totalVerified)}
          </p>
          <p className="mt-1 text-xs text-piedra">
            {isElectricity
              ? "Recibos de energía con comprobante verificado"
              : "Pagos de renta con comprobante verificado"}
          </p>
        </div>

        <div className="card bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">
            En Revisión ({selectedYear})
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[#734d08] sm:text-3xl">
            {formatMoney(totalPending)}
          </p>
          <p className="mt-1 text-xs text-piedra">
            {isElectricity
              ? "Recibos eléctricos pendientes de validar"
              : "Transferencias pendientes de validar"}
          </p>
        </div>

        <div className="card bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-piedra">
            {isElectricity ? "Recibos Registrados" : "Transacciones Registradas"}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-azul sm:text-3xl">
            {payments.length}
          </p>
          <p className="mt-1 text-xs text-piedra">Comprobantes procesados en el período</p>
        </div>
      </div>

      {/* ───────────── 12-MONTH REVENUE CHART ───────────── */}
      <section className="card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-azul">
              {isElectricity
                ? `Consumo Eléctrico Verificado por Mes · ${selectedYear}`
                : `Recaudación Mensual Verificada · ${selectedYear}`}
            </h2>
            <p className="text-xs text-piedra">
              Toque cualquier mes para revisar sus comprobantes en el módulo de verificación.
            </p>
          </div>

          {spaceGroups.length > 0 && (
            <div
              aria-label="Leyenda por local"
              className="flex flex-wrap items-center gap-2"
            >
              {spaceGroups.map((group) => (
                <span
                  key={group.spaceId}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${group.color.badgeBgClass} ${group.color.borderClass}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${group.color.dotClass}`}
                  />
                  <span className={`font-bold ${group.color.badgeTextClass}`}>
                    {group.spaceName}
                  </span>
                  <span className="font-semibold tabular-nums text-piedra">
                    {formatMoney(group.verifiedTotal)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {monthlyTotals.map((m) => {
            const pct =
              m.verifiedSum > 0
                ? Math.max(14, Math.round((m.verifiedSum / maxMonthTotal) * 100))
                : 4;
            const breakdown =
              m.segments.length > 0
                ? ` — ${m.segments.map((s) => `${s.spaceName}: ${formatMoney(s.amount)}`).join(" · ")}`
                : "";
            const monthTitle = `${m.name} ${selectedYear}: ${formatMoney(m.verifiedSum)}${breakdown}`;

            return (
              <Link
                key={m.monthNumber}
                href={`/admin/pagos?tipo=${selectedType}&mes=${m.monthNumber}&ano=${selectedYear}`}
                title={monthTitle}
                aria-label={monthTitle}
                className="group flex flex-col items-center rounded-xl border border-crema/70 bg-arena/40 p-2 transition hover:border-azul/30 hover:bg-white"
              >
                <div className="flex h-20 w-full items-end justify-center rounded-lg bg-arena p-1">
                  {m.verifiedSum > 0 ? (
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-md divide-y divide-y-reverse divide-white/25 transition-all group-hover:brightness-110"
                      style={{ height: `${pct}%` }}
                    >
                      {m.segments.map((seg) => (
                        <div
                          key={seg.spaceId}
                          className={`w-full ${seg.color.barClass}`}
                          style={{ flex: `${seg.amount} 1 0%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="w-full rounded-md bg-crema"
                      style={{ height: `${pct}%` }}
                    />
                  )}
                </div>
                <span className="mt-1.5 font-mono text-[10px] font-bold uppercase text-tinta">
                  {m.shortName}
                </span>
                <span className="text-[10px] font-semibold tabular-nums text-piedra">
                  {m.verifiedSum > 0 ? `L ${(m.verifiedSum / 1000).toFixed(1)}k` : "—"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <SpacePaymentsAccordion
        key={`${selectedYear}-${selectedType}`}
        groups={spaceGroups}
        selectedYear={selectedYear}
        totalPaymentsCount={payments.length}
        paymentType={selectedType}
      />
    </div>
  );
}
