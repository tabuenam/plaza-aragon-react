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
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="inquilino@ejemplo.com"
          className="field"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-xs font-semibold text-azul hover:underline"
            aria-pressed={showPassword}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
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
            className="field pr-12"
          />
        </div>
      </div>

      <FormMessage state={state} />

      <SubmitButton pendingText="Iniciando sesión…" className="btn-primary w-full">
        Iniciar sesión
      </SubmitButton>

      <div className="pt-2 text-center text-sm text-piedra">
        <Link href="/" className="hover:text-azul hover:underline">
          ← Volver a la página principal
        </Link>
      </div>
    </form>
  );
}
