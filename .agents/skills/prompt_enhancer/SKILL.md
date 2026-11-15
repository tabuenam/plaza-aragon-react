---
name: prompt_enhancer
description: >-
  Enhances, refines, and structures raw user prompts into codebase-grounded,
  execution-ready software development prompts and requirement specs tailored
  specifically to the Plaza Aragón project (Next.js 16 App Router, React 19,
  Tailwind v4, Supabase PostgreSQL/Auth/RLS/Storage). Trigger whenever the user
  asks to improve, enhance, rewrite, sharpen, or structure a prompt, feature
  request, bug report, or spec for Plaza Aragón, or invokes /prompt_enhancer.
---

# Plaza Aragón · Prompt Enhancer

Transform raw ideas, brief requests, or bug reports (in Spanish or English) into precise, codebase-grounded, execution-ready development prompts or formal specification documents for **Plaza Aragón** (Olanchito, Yoro, Honduras).

## Workflow

### Step 1: Classify Intent & Scope
Categorize the user's raw input into one primary mode (or a clear combination):
- `feature`: New end-to-end capability (UI + Server Action + DB/Storage).
- `ui-ux`: Component styling, mobile responsiveness, modals, or public catalog polish.
- `bugfix`: Defect reproduction, root-cause investigation, regression fix, and test.
- `schema-data`: New tables/columns, Supabase migration, RLS policies, or Storage buckets.
- `seo-geo`: Metadata, JSON-LD, OpenGraph, `robots.ts`, `sitemap.ts`, or `llms.txt`.
- `refactor-test`: Extracting pure helpers into `src/lib/` and adding `node --test` coverage.

### Step 2: Ground in Plaza Aragón Codebase
Read [codebase_map.md](./references/codebase_map.md) and map every domain concept in the user's request to exact repository artifacts:
- Target route(s) and client/server components under `src/app/` and `src/components/`.
- Server Actions (`actions.ts`) and `requireUser()` / `requireTenant()` / `requireAdmin()` guards.
- Data queries in `src/lib/data.ts`, shared types in `src/lib/types.ts`, and pure domain helpers (`validation.ts`, `format.ts`, `catalog.ts`, `compress-image.ts`, `phone.ts`).
- Database tables, constraints, RLS policies (`public.is_admin()`), and Storage buckets (`spaces`, `receipts`, `contracts`).
- Exact `revalidatePath()` targets affected by the mutation.

### Step 3: Inject Project Guardrails
Embed only the guardrails relevant to the task—never generic filler:
- **Spanish & Domain Copy**: 100% Spanish UI, labels, validation messages, and empty states. Use *«cuota mensual»* (never *«canon»*), *«local comercial»*, *«arrendatario / inquilino»*, *«comprobante de transferencia»*, and *«depósito en garantía»*. Format currency in HNL (`L`) via `formatMoney()` and dates/periods in `America/Tegucigalpa` via `formatDate()` / `formatPeriod()`.
- **Next.js 16 & React 19**: App Router, `src/proxy.ts` (never `middleware.ts`), `"use cache"` for public static reads (`getPublicSpaces()`), `useActionState` / `FormState` pattern (`{ ok: boolean; message: string }`), `require*` auth checks in every Server Action/page, and `revalidatePath()` across all affected routes.
- **Mobile-First & Olanchito Design System**: Operable at `360px` width without horizontal overflow; `min-h-11` / `min-h-12` (44px+) touch targets; client-side `compressImage()` before uploading images (<4MB upload cap, 15MB `serverActions.bodySizeLimit`); Olanchito tokens (`azul`, `turquesa`, `barro`, `maiz`, `selva`, `arena`, `crema`, `tinta`, `piedra`) and `.field`, `.label`, `.btn-*`, `.card`, `AdminDialog`, `AdminToast` primitives.
- **Strict Code Quality**: Zero code comments (unless non-obvious constraint requires explanation and consistent with repo minimalism), zero overengineering or unnecessary third-party libraries, pure validation/business logic extracted to `src/lib/` with `node --test` suites in `src/lib/__tests__/*.test.ts`.
- **Schema Integrity**: Any DB/Storage change must add a timestamped file in `supabase/migrations/` and keep `supabase/schema.sql` in sync.

### Step 4: Surface Ambiguities
Identify **1–3 high-impact edge cases or product decisions** the raw prompt left open (e.g., partial payments vs. duplicate-period constraint `payments_one_per_period`, RLS tenant isolation, Storage cleanup on failure/delete, mobile camera upload vs. PDF support). Pair each question with a **recommended Plaza Aragón default**.

### Step 5: Deliver Output
Consult [prompt_templates.md](./references/prompt_templates.md) for the matching structure and produce these four sections:
1. **Context & Improvements Added**: Bullet list of codebase files, constraints, and edge cases injected.
2. **Enhanced Prompt**: A self-contained, copy-pasteable prompt block ready for immediate execution (or formatted as a `src/specs-dev/` spec if requested).
3. **Open Questions (if any)**: Up to 3 concise clarifications with recommended defaults.
4. **Next Action**: Ask the user whether to execute the enhanced prompt right away or save it as a requirement specification in `src/specs-dev/`.
