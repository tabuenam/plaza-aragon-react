import type { FormState } from "@/lib/types";

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) {
    return <p aria-live="polite" className="sr-only" />;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
        state.ok
          ? "border border-selva/20 bg-selva-claro text-selva"
          : "border border-barro/20 bg-barro-claro text-barro"
      }`}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold">
        {state.ok ? "✓" : "!"}
      </span>
      <span>{state.message}</span>
    </div>
  );
}
