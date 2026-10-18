import type { ReactNode } from "react";

/** Expandable panel built on native `<details>`: keyboard accessible, no JS needed. */
export function CollapsibleSection({
  title,
  count,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-3xl bg-white shadow-sm ring-1 ring-crema">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-3xl px-5 py-4 transition hover:bg-arena/60 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-azul sm:text-xl">
            {title}
            {count !== undefined && (
              <span className="rounded-full bg-azul/10 px-2.5 py-0.5 font-sans text-xs font-bold text-azul">
                {count}
              </span>
            )}
          </h2>
          {description && <p className="mt-0.5 text-xs text-piedra">{description}</p>}
        </div>
        <svg
          className="h-5 w-5 shrink-0 text-piedra transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="border-t border-crema">{children}</div>
    </details>
  );
}
