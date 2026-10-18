"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInAction } from "@/app/ingresar/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: true, message: "" };

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} data-testid="sign-in-form" className="space-y-5">
      <div>
        <label htmlFor="email" className="label">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="inquilino@plaza-aragon.com"
          data-testid="signin-email"
          className="field"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold text-tinta">
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            data-testid="signin-toggle-password"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-azul transition hover:bg-arena cursor-pointer"
            aria-pressed={showPassword}
          >
            {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            enterKeyHint="done"
            data-testid="signin-password"
            className="field"
          />
        </div>
      </div>

      <FormMessage state={state} />

      <SubmitButton pendingText="Verificando credenciales…" className="btn-primary w-full">
        Ingresar a mi cuenta →
      </SubmitButton>

      <div className="border-t border-crema/80 pt-4 text-center text-sm text-piedra">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-semibold text-piedra transition hover:text-azul"
        >
          ← Volver al catálogo de Plaza Aragón
        </Link>
      </div>
    </form>
  );
}

