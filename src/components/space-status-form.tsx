"use client";

import { useActionState } from "react";
import { updateSpaceStatusAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { FormState, Space } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function SpaceStatusForm({ space }: { space: Space }) {
  const [state, formAction] = useActionState(updateSpaceStatusAction, initialState);

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-crema/60 pt-3">
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
            step="100"
            defaultValue={space.price}
            className="field min-h-10 text-xs px-2.5 py-1.5"
          />
        </div>
      </div>

      <FormMessage state={state} />

      <SubmitButton pendingText="Actualizando…" className="btn-primary min-h-9 w-full text-xs py-1.5">
        Actualizar local
      </SubmitButton>
    </form>
  );
}
