import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOutAction } from "@/app/ingresar/actions";
import { Logo } from "@/components/logo";
import { AdminBreadcrumbs, AdminNavTabs } from "@/app/admin/admin-nav";
import { AdminToastProvider } from "@/app/admin/admin-toast";

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <AdminToastProvider>
      <div className="flex min-h-screen flex-col bg-arena">
        <header className="sticky top-0 z-30 border-b border-crema bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/admin" className="inline-block">
                <Logo />
              </Link>
              <span className="hidden rounded-full bg-azul/10 px-2.5 py-0.5 text-xs font-bold text-azul uppercase sm:inline-block">
                Panel de Propietario
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span
                title={user.email ?? "Administrador"}
                className="hidden items-center gap-1.5 text-xs font-medium text-piedra/80 md:inline-flex"
              >
                <svg
                  className="h-3.5 w-3.5 text-piedra/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Administrador
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-piedra transition hover:bg-barro-claro/40 hover:text-barro"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>

          <AdminNavTabs />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <AdminBreadcrumbs />
            {children}
          </div>
        </main>

        <footer className="border-t border-crema bg-white py-6">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-piedra sm:px-6">
            Plaza Aragón · Panel de Administración · Olanchito, Yoro
          </div>
        </footer>
      </div>
    </AdminToastProvider>
  );
}
