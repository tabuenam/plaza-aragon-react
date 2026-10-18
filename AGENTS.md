<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Plaza Aragón

Commercial-space management app for Plaza Aragón (Olanchito, Honduras). UI copy and domain terms are in **Spanish**; currency is HNL (Lempiras). See `README.md` and `src/specs-dev/` for requirements.

## Stack
Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + RLS + Storage) · Vercel. Path alias `@/` → `src/`.

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run seed` (test users/data via `scripts/seed.mjs`, needs `.env.local`).

## Env (`.env.local`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (service role, server-only, never expose), `NEXT_PUBLIC_WHATSAPP_NUMBER`.

## Layout
- `src/app/` — `/` public catalog · `/ingresar` login · `/portal` tenant (payments, receipt upload) · `/admin` owner (`pagos`, `contratos`, `historial`). Each area colocates its feature-specific components, modals, and `actions.ts` (server actions).
- `src/proxy.ts` — Next 16 proxy (replaces middleware): refreshes the Supabase session and redirects by role (unauthenticated → `/ingresar`; admin ↔ `/admin`, tenant ↔ `/portal`).
- `src/lib/auth.ts` — `requireUser/requireTenant/requireAdmin` (role from JWT `app_metadata.role === "admin"`).
- `src/lib/supabase/` — `server.ts` (cookie-based SSR client), `static.ts` (public/cached reads), `admin.ts` (service-role client; server only).
- `src/lib/data.ts` queries · `types.ts` · `format.ts` · `compress-image.ts` (client-side receipt compression).
- `src/components/` — shared cross-feature UI components (`logo`, `status-badge`, `submit-button`, `form-message`, `contract-attachments-view`).
- `supabase/` — `schema.sql`, `migrations/`, `seed.sql`, `config.toml`.

## Data model
Tables `spaces`, `tenants`, `leases`, `payments` (status: pending/verified/rejected) with RLS; `public.is_admin()` helper. Storage buckets: `receipts` (private, per-user folder `<uid>/…`) and `spaces` (public photos, admin-write).

## Conventions
- Authorize in server actions/pages with `require*` helpers and rely on RLS; use the service-role client only when RLS can't apply.
- Keep it mobile-first; tenants upload receipts from phone cameras.
- Schema changes: add a migration in `supabase/migrations/` and keep `schema.sql` in sync.
- Dev logins (seeded): `admin@plaza-aragon.com`, `inquilino1@…`, `inquilino2@…` (see README).
