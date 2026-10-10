import type { PaymentStatus, SpaceStatus } from "@/lib/types";

const STATUS: Record<SpaceStatus | PaymentStatus, { label: string; className: string; icon: string }> = {
  available: { label: "Disponible", className: "bg-selva-claro text-selva", icon: "●" },
  occupied: { label: "Ocupado", className: "bg-turquesa-claro text-azul", icon: "■" },
  construction: { label: "En construcción", className: "bg-maiz-claro text-[#7a5410]", icon: "▲" },
  pending: { label: "Pendiente", className: "bg-maiz-claro text-[#7a5410]", icon: "◷" },
  verified: { label: "Verificado", className: "bg-selva-claro text-selva", icon: "✓" },
  rejected: { label: "Rechazado", className: "bg-barro-claro text-barro", icon: "✕" },
};

export function StatusBadge({ status }: { status: SpaceStatus | PaymentStatus }) {
  const { label, className, icon } = STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
