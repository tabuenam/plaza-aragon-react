import type { FormState } from "@/lib/types";

export function FormMessage({ state }: { state: FormState }) {
  return (
    <p
      aria-live="polite"
      className={
        state.message
          ? `rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? "bg-selva-claro text-selva" : "bg-barro-claro text-barro"}`
          : "sr-only"
      }
    >
      {state.message}
    </p>
  );
}
