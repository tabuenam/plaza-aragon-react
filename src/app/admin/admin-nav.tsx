"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  breadcrumbTitle: string;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Resumen y Locales",
    breadcrumbTitle: "Panel de Control",
    exact: true,
  },
  {
    href: "/admin/contratos",
    label: "Contratos",
    breadcrumbTitle: "Contratos de Arrendamiento",
  },
  {
    href: "/admin/pagos",
    label: "Verificación de Pagos",
    breadcrumbTitle: "Verificación de Pagos",
  },
  {
    href: "/admin/historial",
    label: "Historial Contable",
    breadcrumbTitle: "Historial Contable",
  },
];

function isTabActive(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <div className="border-t border-crema/60 bg-arena/40 px-4 sm:px-6">
      <nav
        aria-label="Navegación de administración"
        className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-1.5 py-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2"
      >
        {NAV_ITEMS.map((item) => {
          const active = isTabActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 py-2 text-center text-xs font-semibold transition sm:justify-start sm:px-4 ${
                active
                  ? "bg-azul text-white shadow-xs ring-1 ring-azul-oscuro/20"
                  : "text-piedra hover:bg-crema/60 hover:text-tinta"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const activeItem =
    NAV_ITEMS.find((item) => isTabActive(pathname, item)) ?? NAV_ITEMS[0];
  const isRoot = activeItem.href === "/admin";

  return (
    <nav
      aria-label="Ruta de navegación"
      className="mb-4 flex items-center gap-1.5 text-xs font-medium text-piedra"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="inline-flex items-center gap-1.5">
          <svg
            className="h-3.5 w-3.5 text-azul/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          {isRoot ? (
            <span className="text-piedra">Administración</span>
          ) : (
            <Link
              href="/admin"
              className="text-piedra transition hover:text-azul hover:underline"
            >
              Administración
            </Link>
          )}
        </li>
        <li aria-hidden="true" className="text-piedra/60">
          ›
        </li>
        <li>
          <span
            aria-current="page"
            className="rounded-md bg-crema/50 px-2 py-0.5 font-semibold text-azul"
          >
            {activeItem.breadcrumbTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}
