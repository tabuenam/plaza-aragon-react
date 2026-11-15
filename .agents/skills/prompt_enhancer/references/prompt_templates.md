# Plaza Aragón · Prompt Templates & Examples

Use these templates when drafting the **Enhanced Prompt** section of the output. Pick the template that matches the classified intent and replace bracketed sections with exact file paths, types, actions, and constraints from [codebase_map.md](./codebase_map.md).

---

## Template 1: Full-Stack Feature / Server Action

```markdown
Implement [feature summary] in Plaza Aragón following Next.js 16 App Router, React 19, and Supabase conventions.

### 1. Target Files & Scope
- **Routes / UI**: [e.g. `src/app/admin/contratos/...`]
- **Server Actions**: [e.g. `src/app/admin/actions.ts` -> `<actionName>` returning `FormState`]
- **Data / Domain**: [e.g. `src/lib/data.ts`, `src/lib/types.ts`, `src/lib/validation.ts`, `src/lib/format.ts`]
- **Database / Storage** (if applicable): [new file in `supabase/migrations/<timestamp>_<name>.sql` + sync `supabase/schema.sql`]

### 2. Functional Behavior
1. [Step-by-step user flow, form fields, and default values in Spanish]
2. [Authorization guard: `requireAdmin()` / `requireTenant()` and Supabase RLS expectations]
3. [Validation rules: extract pure validators to `src/lib/validation.ts`; return Spanish `FormState` error messages]
4. [Storage / Rollback: sanitize filenames via `sanitizeStorageFileName()`, compress client images via `compressImage()`, clean up uploaded files if DB mutation fails]
5. [Cache Revalidation: call `revalidatePath()` on all affected paths]

### 3. UI & Domain Guardrails
- 100% Spanish UI and error copy; use «cuota mensual» (never «canon»), currency HNL (`formatMoney`), timezone `America/Tegucigalpa` (`formatDate`/`formatPeriod`).
- Mobile-first from 360px width without horizontal overflow; touch targets >= 44px (`min-h-11` / `min-h-12`).
- Reuse `.field`, `.label`, `.btn-primary`, `.btn-ghost`, `.card`, `AdminDialog`, and `useAdminToast()`.
- No unnecessary dependencies or code comments; keep implementation direct and readable.

### 4. Verification
- Add/update unit tests in `src/lib/__tests__/<module>.test.ts` for any pure domain logic.
- Run `npm test`, `npm run lint`, and `npm run build` (or typecheck) and report results.
```

---

## Template 2: Mobile-First UI / Modal Enhancement

```markdown
Update [component/page] in Plaza Aragón to [UI goal].

### 1. Files to Modify
- [Exact component/page path(s) in `src/app/` or `src/components/`]
- [Styling tokens/classes in `src/app/globals.css` if needed]

### 2. Design & Ergonomics Requirements
- **Visual System**: Follow the Olanchito palette (`azul`, `turquesa`, `barro`, `maiz`, `selva`, `arena`, `crema`, `tinta`, `piedra`) and typography (`--font-display`, `--font-sans`).
- **Mobile-First Layout**: Test mentally down to 360px width; zero horizontal scrolling; single-handed touch targets >= 44px (`min-h-11` / `min-h-12`).
- **Accessibility & Feedback**: Use native `<dialog>` via `AdminDialog` for modals, `aria-label`/`aria-labelledby`, pending state via `SubmitButton` / `useTransition`, and feedback via `useAdminToast()` or `FormMessage`.
- **Copy**: Strictly Spanish, natural Olanchito commercial terminology («cuota mensual», «local comercial», «comprobante de transferencia»).

### 3. Verification
- Run `npm run lint` and `npm test` after changes and verify responsive breakpoints (360px mobile & desktop).
```

---

## Template 3: Database Migration & RLS Policy

```markdown
Add [table/column/index/policy change] to the Plaza Aragón Supabase schema.

### 1. Files to Create / Update
- New migration: `supabase/migrations/<YYYYMMDDHHMMSS>_<slug>.sql`
- Canonical schema: `supabase/schema.sql` (must remain 100% in sync)
- Types & Queries: `src/lib/types.ts`, `src/lib/data.ts`
- Seed (if required): `supabase/seed.sql` / `scripts/seed.mjs`

### 2. Security & Constraints
- Enable RLS (`alter table ... enable row level security`) and reuse `public.is_admin()` for admin policies.
- Restrict tenant policies using `(select auth.uid())` so tenants only read/write their own records.
- Enforce domain invariants at the DB level (`check` constraints, foreign keys, partial unique indexes).
- Preserve existing storage bucket rules (`spaces` public, `receipts` and `contracts` private).

### 3. Verification
- Verify `supabase/schema.sql` matches the migration DDL cleanly.
- Update `src/lib/validation.ts` and `src/lib/__tests__/` if constraints introduce new validation rules, then run `npm test` and `npm run lint`.
```

---

## Template 4: Bug Investigation & Fix

```markdown
Investigate and fix [bug symptom] in Plaza Aragón.

### 1. Suspected Entry Points
- **Routes / UI**: [suspected component(s)]
- **Actions / Queries**: [suspected action(s) in `actions.ts` or `src/lib/data.ts`]
- **Auth / Proxy / Validation**: [`src/proxy.ts`, `src/lib/auth.ts`, `src/lib/validation.ts`]

### 2. Investigation & Fix Protocol
1. Reproduce or trace the exact failing data flow across client -> Server Action -> Supabase/Storage.
2. Identify the root cause before editing any file (check RLS policies, unique indexes like `payments_one_per_period`, `compressImage()` fallback, `America/Tegucigalpa` date parsing, or missing `revalidatePath()`).
3. Implement the minimal, clean fix without comments or overengineering.
4. Add a regression test in `src/lib/__tests__/` covering the bug input if testable as pure logic.

### 3. Verification
- Run `npm test` and `npm run lint`, and confirm the exact scenario is resolved.
```

---

## Template 5: Formal Requirement Spec (`src/specs-dev/`)

```markdown
Create a specification document at `src/specs-dev/<FEATURE>_REQUIREMENT.md` (in Spanish, matching `src/specs-dev/LOCAL_EDIT_REQUIREMENT.md` style) before writing implementation code:
1. **Contexto y Objetivo**
2. **Alcance Funcional y Reglas de Negocio** (exact fields, types, validations)
3. **Experiencia de Usuario (UX) y Diseño Mobile-First** (360px, 44px touch targets, Olanchito tokens)
4. **Arquitectura Técnica y Datos** (Next.js 16 App Router, Server Actions, `require*`, Supabase tables/RLS/buckets, `revalidatePath`)
5. **Criterios de Aceptación** (verifiable checklist)
```

---

## Concrete Before -> After Examples

### Example 1: Raw Feature Request
- **Raw Prompt**:
  > "Add a way for admin to renew a lease quickly when it expires."
- **Enhanced Prompt**:
  > Implement a one-click lease renewal flow in `/admin/contratos` (`src/app/admin/contratos/page.tsx`) for active or expired leases:
  > 1. **UI**: Add a `RenewLeaseModal` (using `AdminDialog`) triggered from lease rows/cards in `src/app/admin/contratos/page.tsx`. Pre-fill `space_id`, `tenant_id`, `monthly_rent`, and set the new `start_date` to the day after the previous `end_date` (or `todayInHonduras()` if later) and `end_date` to +6 or +12 months by default, plus optional new `contract_files` upload. All labels in Spanish (*«Renovar contrato»*, *«Cuota mensual»*, *«Fecha de inicio»*, *«Fecha de finalización»*).
  > 2. **Server Action (`src/app/admin/actions.ts`)**: Add `renewLeaseAction(_prevState: FormState, formData: FormData)` guarded by `requireAdmin()`. Validate inputs with `validateLeaseInput()`. Because `leases` enforces `leases_one_active_per_space` (`unique index on (space_id) where active`), atomically set the previous lease `active = false` before inserting the new active lease, upload new attachments to the private `contracts` bucket under `<newLeaseId>/<ts>-<rand>-<cleanName>.<ext>` using `sanitizeStorageFileName()`, and roll back storage files if DB insertion fails. Ensure `spaces.status` is `'occupied'`.
  > 3. **Revalidation & Feedback**: Call `revalidateLeaseViews()` and display feedback via `useAdminToast()`.
  > 4. **Tests & Checks**: Add pure date/renewal-period helper tests in `src/lib/__tests__/` if extracted to `src/lib/format.ts`, then run `npm test` and `npm run lint`.

### Example 2: Raw UI / Ledger Improvement
- **Raw Prompt**:
  > "In admin historial, let me filter by pending/verified and see total money collected for that month."
- **Enhanced Prompt**:
  > Enhance the historical ledger in `src/app/admin/historial/page.tsx` and `src/app/admin/historial/space-payments-accordion.tsx`:
  > 1. **Status Filtering & Monthly Summary**: Add a touch-friendly filter bar (`min-h-11`, no horizontal overflow on 360px screens) for `Todos` / `Verificados` / `Pendientes` / `Rechazados`, plus a summary card showing total verified revenue in HNL (`formatMoney()`) for the selected period (`year`/`month`) and count of pending receipts.
  > 2. **Pure Aggregation**: Extract any period/status totals calculation into a pure helper (e.g. in `src/lib/format.ts` or a dedicated helper) without adding external state or table libraries.
  > 3. **Styling**: Use existing `.card`, `StatusBadge`, and Olanchito color tokens (`selva`, `maiz`, `barro`, `azul`, `arena`, `crema`). All copy strictly in Spanish.
  > 4. **Verification**: Add unit tests in `src/lib/__tests__/format.test.ts` for the aggregation helper and run `npm test` and `npm run lint`.

### Example 3: Raw Bug Report
- **Raw Prompt**:
  > "Sometimes tenants say they can't upload their receipt from iPhone because it fails or says duplicate."
- **Enhanced Prompt**:
  > Investigate and fix iPhone mobile receipt upload failures in the tenant portal (`/portal`):
  > 1. **Inspect**: Check `src/app/portal/payment-form.tsx`, `src/lib/compress-image.ts` (`compressImage`, `MAX_UPLOAD_BYTES`), `src/app/portal/actions.ts` (`submitPaymentAction`), `src/lib/validation.ts` (`sanitizeStorageFileName`), and `supabase/schema.sql` (`payments_one_per_period`, `receipts` bucket `allowed_mime_types`).
  > 2. **Check Edge Cases**:
  >    - HEIC/HEIF photos from iOS Safari where `createImageBitmap()` may throw or `file.type` may be empty (`""`) or `image/heic` — ensure `compressImage()` falls back cleanly and `submitPaymentAction` checks extension/size (`MAX_UPLOAD_BYTES` = 4 MB) and maps `heic`/`heif` MIME types safely.
  >    - Duplicate submission feedback when `payments_one_per_period` prevents a second non-rejected payment for the same `(lease_id, period_year, period_month)` or when a rejected payment needs re-submission.
  > 3. **Verification**: Add unit tests for HEIC/empty-MIME fallback and filename sanitization in `src/lib/__tests__/compress-image.test.ts` and `src/lib/__tests__/validation.test.ts`, then run `npm test` and `npm run lint`.
