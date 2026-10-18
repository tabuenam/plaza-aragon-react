import type { ReactNode } from "react";
import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { signOutAction } from "@/app/ingresar/actions";
import { Logo } from "@/components/logo";

export const instant = false;

export default async function TenantPortalLayout({ children }: { children: ReactNode }) {
  const user = await requireTenant();

  return (
    <div className="flex min-h-dvh flex-col bg-arena">
      <div className="lenca-band h-1.5 w-full" />
      <header className="sticky top-0 z-30 border-b border-crema bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/portal" className="inline-block">
              <Logo />
            </Link>
            <span className="hidden rounded-full bg-turquesa-claro/80 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-azul uppercase ring-1 ring-azul/15 sm:inline-block">
              Portal de Inquilino
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="hidden text-xs font-medium text-piedra md:inline-block">
              {user.email}
            </span>
            <Link
              href="/"
              className="hidden rounded-xl px-2.5 py-1.5 text-xs font-semibold text-piedra transition hover:bg-arena hover:text-azul sm:inline-flex"
            >
              Catálogo público ↗
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-crema bg-arena px-3 py-1.5 text-xs font-semibold text-tinta transition hover:border-barro/30 hover:bg-barro-claro/40 hover:text-barro cursor-pointer"
              >
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <footer className="border-t border-crema bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-piedra sm:flex-row sm:px-6">
          <span>Plaza Aragón · Portal Digital de Inquilinos · Olanchito, Yoro</span>
          <Link href="/" className="font-semibold text-azul hover:underline">
            Ir a página principal
          </Link>
        </div>
      </footer>
    </div>
  );
}

