export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#0d4a7a" />
      <path d="M9 33V19a11 11 0 0 1 22 0v14" fill="none" stroke="#e5a82a" strokeWidth="3" />
      <path d="M15 33v-9a5 5 0 0 1 10 0v9z" fill="#b9542a" />
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

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-xl font-semibold leading-none ${light ? "text-white" : "text-azul"}`}>
        Plaza <span className={light ? "text-maiz" : "text-barro"}>Aragón</span>
      </span>
    </span>
  );
}
