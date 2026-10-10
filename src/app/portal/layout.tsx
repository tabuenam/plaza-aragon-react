import type { ReactNode } from "react";
import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { signOutAction } from "@/app/ingresar/actions";
import { Logo } from "@/components/logo";

export const instant = false;

export default async function TenantPortalLayout({ children }: { children: ReactNode }) {
  const user = await requireTenant();

  return (
    <div className="flex min-h-screen flex-col bg-arena">
      <header className="sticky top-0 z-30 border-b border-crema bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/portal" className="inline-block">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-piedra sm:inline-block">
              {user.email}
            </span>
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
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <footer className="border-t border-crema bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-piedra sm:px-6">
          Plaza Aragón · Portal de Inquilinos · Olanchito, Yoro
        </div>
      </footer>
    </div>
  );
}
