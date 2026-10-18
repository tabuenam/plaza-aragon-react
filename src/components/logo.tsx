export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#0b3d66" />
      <rect x="2" y="2" width="36" height="36" rx="9" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" />
      <path d="M9 33V19a11 11 0 0 1 22 0v14" fill="none" stroke="#df9b1a" strokeWidth="2.75" strokeLinecap="round" />
      <path d="M15 33v-9a5 5 0 0 1 10 0v9z" fill="#b84a24" />
      <g fill="#ffffff">
        <circle cx="16.5" cy="12.5" r="1.2" />
        <circle cx="23.5" cy="12.5" r="1.2" />
        <circle cx="20" cy="15" r="1.2" />
        <circle cx="16.5" cy="17.5" r="1.2" />
        <circle cx="23.5" cy="17.5" r="1.2" />
      </g>
    </svg>
  );
}

export function Logo({ light = false, subtitle = false }: { light?: boolean; subtitle?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="h-9 w-9 shrink-0 shadow-2xs" />
      <span className="flex flex-col">
        <span className={`font-display text-xl font-bold tracking-tight leading-none ${light ? "text-white" : "text-azul"}`}>
          Plaza <span className={light ? "text-maiz" : "text-barro"}>Aragón</span>
        </span>
        {subtitle && (
          <span
            className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] leading-none ${
              light ? "text-crema/75" : "text-piedra"
            }`}
          >
            Olanchito · Honduras
          </span>
        )}
      </span>
    </span>
  );
}

