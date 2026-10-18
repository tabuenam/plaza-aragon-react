import type { PaymentStatus, SpaceStatus } from "@/lib/types";

const STATUS: Record<SpaceStatus | PaymentStatus, { label: string; className: string; dotClass: string }> = {
  available: {
    label: "Disponible",
    className: "bg-selva-claro/90 text-selva ring-1 ring-selva/20",
    dotClass: "bg-selva",
  },
  occupied: {
    label: "Ocupado",
    className: "bg-turquesa-claro/80 text-azul ring-1 ring-azul/15",
    dotClass: "bg-azul",
  },
  construction: {
    label: "En preventa · Obra",
    className: "bg-maiz-claro text-[#734d08] ring-1 ring-maiz/35",
    dotClass: "bg-maiz",
  },
  pending: {
    label: "En revisión",
    className: "bg-maiz-claro text-[#734d08] ring-1 ring-maiz/35",
    dotClass: "bg-maiz animate-pulse",
  },
  verified: {
    label: "Verificado",
    className: "bg-selva-claro/90 text-selva ring-1 ring-selva/20",
    dotClass: "bg-selva",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-barro-claro text-barro ring-1 ring-barro/25",
    dotClass: "bg-barro",
  },
};

export function StatusBadge({ status }: { status: SpaceStatus | PaymentStatus }) {
  const { label, className, dotClass } = STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

