import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SignInForm } from "@/app/ingresar/sign-in-form";

export const metadata: Metadata = {
  title: "Ingresar al Portal",
  description: "Acceso para inquilinos y administración de Plaza Aragón.",
};

export default function IngresarPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold tracking-tight text-azul sm:text-3xl">
          Portal de Inquilinos
        </h1>
        <p className="mt-2 text-center text-sm text-piedra">
          Ingrese con sus credenciales para gestionar sus pagos y contratos.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
