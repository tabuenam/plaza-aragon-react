import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOutAction } from "@/app/ingresar/actions";
import { Logo } from "@/components/logo";

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-arena">
      <header className="sticky top-0 z-30 border-b border-crema bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="inline-block">
              <Logo />
            </Link>
            <span className="hidden rounded-full bg-azul/10 px-2.5 py-0.5 text-xs font-bold text-azul uppercase sm:inline-block">
              Panel de Propietario
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-piedra md:inline-block">{user.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-crema bg-arena px-3.5 py-1.5 text-xs font-semibold text-tinta transition hover:bg-crema"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <div className="no-scrollbar flex border-t border-crema/60 px-4 sm:px-6">
          <nav className="mx-auto flex max-w-6xl w-full gap-2 overflow-x-auto py-2">
            <Link
              href="/admin"
              className="inline-flex min-h-10 shrink-0 items-center rounded-xl px-4 py-2 text-xs font-semibold text-tinta hover:bg-crema/40"
            >
              Resumen y Locales
            </Link>
            <Link
              href="/admin/pagos"
              className="inline-flex min-h-10 shrink-0 items-center rounded-xl px-4 py-2 text-xs font-semibold text-tinta hover:bg-crema/40"
            >
              Verificación de Pagos
            </Link>
            <Link
              href="/admin/historial"
              className="inline-flex min-h-10 shrink-0 items-center rounded-xl px-4 py-2 text-xs font-semibold text-tinta hover:bg-crema/40"
            >
              Historial Contable
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <footer className="border-t border-crema bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-piedra sm:px-6">
          Plaza Aragón · Panel de Administración · Olanchito, Yoro
        </div>
      </footer>
    </div>
  );
}
