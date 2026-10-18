"use client";

import { useActionState, useState } from "react";
import { updateSpaceStatusAction } from "@/app/admin/actions";
import { useAdminToast } from "@/app/admin/admin-toast";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { FormState, Space } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function SpaceStatusForm({ space }: { space: Space }) {
  const { notify } = useAdminToast();
  const [justSaved, setJustSaved] = useState(false);

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await updateSpaceStatusAction(prev, formData);
      if (result.message) {
        notify(
          `${space.name}: ${result.message}`,
          result.ok ? "success" : "error"
        );
      }
      if (result.ok) {
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2600);
      }
      return result;
    },
    initialState
  );

  return (
    <form
      action={formAction}
      className={`mt-3 space-y-3 rounded-xl border-t border-crema/60 pt-3 transition-all ${
        justSaved ? "bg-selva-claro/35 px-2.5 pb-2.5 ring-2 ring-selva/40" : ""
      }`}
    >
      <input type="hidden" name="space_id" value={space.id} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`status-${space.id}`} className="label text-[11px]">
            Estado del local
          </label>
          <select
            id={`status-${space.id}`}
            name="status"
            defaultValue={space.status}
            className="field min-h-10 text-xs px-2.5 py-1.5"
          >
            <option value="available">Disponible</option>
            <option value="occupied">Ocupado</option>
            <option value="construction">En construcción</option>
          </select>
        </div>

        <div>
          <label htmlFor={`price-${space.id}`} className="label text-[11px]">
            Precio mensual (HNL)
          </label>
          <input
            id={`price-${space.id}`}
            name="price"
            type="number"
            min="0"
            step="any"
            defaultValue={space.price}
            className="field min-h-10 text-xs px-2.5 py-1.5"
          />
        </div>
      </div>

      <FormMessage state={state} />

      <SubmitButton
        pendingText="Actualizando…"
        className={`min-h-9 w-full rounded-xl px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] disabled:opacity-60 ${
          justSaved
            ? "bg-selva hover:bg-selva/90"
            : "bg-azul hover:bg-azul-oscuro"
        }`}
      >
        {justSaved ? "✓ ¡Guardado!" : "Actualizar local"}
      </SubmitButton>
    </form>
  );
}
