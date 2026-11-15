# Plaza Aragón · Codebase Reference Map

Use this reference to anchor enhanced prompts in exact files, exports, constraints, and design tokens without speculative paths.

---

## 1. Routes, Pages & Colocated Components

| Area | Route | Files & Key Exports | Auth / Caching |
| :--- | :--- | :--- | :--- |
| **Public Catalog** | `/` | `src/app/page.tsx`, `catalog-explorer.tsx`, `space-gallery.tsx`, `lease-process-section.tsx`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`, `manifest.ts` | Public; reads `getPublicSpaces()` with `"use cache"` |
| **Login / Sign Out** | `/ingresar` | `src/app/ingresar/page.tsx`, `sign-in-form.tsx`, `actions.ts` (`signInAction`, `signOutAction`) | Redirects authenticated users via `src/proxy.ts` |
| **Tenant Portal** | `/portal` | `src/app/portal/layout.tsx`, `page.tsx`, `payment-form.tsx`, `payment-history.tsx`, `actions.ts` (`submitPaymentAction`) | `requireTenant()` |
| **Admin Overview & Spaces** | `/admin` | `src/app/admin/layout.tsx`, `page.tsx`, `edit-space-modal.tsx`, `space-status-form.tsx`, `admin-nav.tsx` (`AdminNavTabs`, `AdminBreadcrumbs`), `admin-dialog.tsx` (`AdminDialog`), `admin-toast.tsx` (`AdminToastProvider`, `useAdminToast`), `actions.ts` (`updateSpaceStatusAction`, `updateSpaceAction`) | `requireAdmin()` |
| **Admin Payments** | `/admin/pagos` | `src/app/admin/pagos/page.tsx`, `payment-review-card.tsx`, `create-payment-modal.tsx`, `actions.ts` (`createAdminPaymentAction`, `verifyPaymentAction`, `rejectPaymentAction`) | `requireAdmin()` |
| **Admin Leases & Tenants** | `/admin/contratos` | `src/app/admin/contratos/page.tsx`, `create-lease-modal.tsx`, `edit-lease-modal.tsx`, `create-tenant-modal.tsx`, `edit-tenant-modal.tsx`, `terminate-lease-button.tsx`, `confirm-delete-button.tsx`, `collapsible-section.tsx`, `actions.ts` (`createLeaseAction`, `updateLeaseAction`, `terminateLeaseAction`, `deleteLeaseAction`, `createTenantAction`, `updateTenantAction`, `deleteTenantAction`) | `requireAdmin()` |
| **Admin Ledger** | `/admin/historial` | `src/app/admin/historial/page.tsx`, `space-payments-accordion.tsx` | `requireAdmin()` |

### Shared Components (`src/components/`)
- `contract-attachments-view.tsx`: Renders signed URLs (1-hour expiry) for PDF and image contract attachments.
- `status-badge.tsx`: Status badges for spaces (`available`, `occupied`, `construction`) and payments (`pending`, `verified`, `rejected`).
- `form-message.tsx`: Inline feedback alert for `FormState` (`ok`, `message`).
- `submit-button.tsx`: Form submit button using `useFormStatus()` pending state.
- `logo.tsx`, `whatsapp-brand.tsx`, `technetica-credit.tsx`: Brand marks and attribution.

---

## 2. Core Library & Domain Layer (`src/lib/`)

| Module | Key Exports & Responsibilities |
| :--- | :--- |
| `src/proxy.ts` | Next.js 16 proxy (replaces `middleware.ts`). Refreshes Supabase SSR cookies, reads `supabase.auth.getClaims()`, checks `claims?.app_metadata?.role === "admin"`, routes `/portal/:path*`, `/admin/:path*`, `/ingresar`. |
| `src/lib/auth.ts` | `getCurrentUser()` (React `cache`), `requireUser()`, `requireTenant()`, `requireAdmin()` (uses `connection()` + redirects). |
| `src/lib/supabase/server.ts` | `createSupabaseServerClient()` — cookie-based SSR client respecting RLS. |
| `src/lib/supabase/static.ts` | `createSupabasePublicClient()` (anonymous static reads inside `"use cache"`), `createSupabaseAdminClient()`. |
| `src/lib/supabase/admin.ts` | `createSupabaseAdminClient()` — service-role client (server-only, used for `auth.admin.*` and storage fallbacks/cleanup). |
| `src/lib/data.ts` | `getPublicSpaces()`, `getTenantLeaseWithSpace()`, `getTenantPayments()`, `getAllSpacesWithActiveLease()`, `getAdminPayments()`, `getReceiptSignedUrl()`, `getContractSignedUrl()`, `getActiveLeases()`, `getAllLeases()`, `getAllTenants()`, `getAdminTenants()`, `getAllSpaces()`. |
| `src/lib/types.ts` | `SpaceStatus`, `PaymentStatus`, `Space`, `Tenant`, `ContractAttachment`, `Lease`, `Payment`, `LeaseWithRelations`, `AdminLease`, `AdminTenant`, `FormState`. |
| `src/lib/validation.ts` | Pure validators: `isValidSpaceStatus()`, `validateSpaceUpdateInput()`, `validateLeaseInput()`, `validatePaymentInput()`, `validateAdminPaymentInput()`, `sanitizeStorageFileName()`. |
| `src/lib/format.ts` | Honduras localization (`TIME_ZONE = "America/Tegucigalpa"`, HNL currency): `MONTHS`, `formatMoney()`, `formatDate()`, `formatPeriod()`, `shortMonth()`, `todayInHonduras()`, `currentPeriod()`, `shiftPeriod()`, `periodKey()`, `parsePeriodKey()`, `comparePeriods()`, `periodOfDate()`, `daysUntil()`, `groupPaymentsByYear()`. |
| `src/lib/catalog.ts` | `FilterOption`, `FAQS`, `PACURA_TAGS`, `COROZAL_TAGS`, `getSpaceHighlights()`, `getSpaceCatalogTags()`, `filterSpaces()`, `computeCatalogStats()`, `buildStructuredData()`. |
| `src/lib/compress-image.ts` | `compressImage(file, maxSize = 1600, quality = 0.8)` via `createImageBitmap` + Canvas JPEG, `MAX_UPLOAD_BYTES = 4 * 1024 * 1024`. |
| `src/lib/phone.ts` | `DEFAULT_PHONE_NUMBER` (`+4915175088921`), `cleanPhoneDigits()`, `formatPhoneDisplay()`, `getAppPhoneNumber()`, `getAppPhoneDigits()`, `getAppPhoneDisplay()`, `getWhatsAppLink()`. |

### Automated Tests (`src/lib/__tests__/`)
Run with `npm test` (`node --test 'src/**/*.test.ts'`):
- `catalog.test.ts`
- `compress-image.test.ts`
- `format.test.ts`
- `phone.test.ts`
- `seo.test.ts`
- `validation.test.ts`

---

## 3. Database Schema, RLS & Storage (`supabase/schema.sql`)

### Tables & Key Constraints
1. **`public.spaces`**: `id` (uuid PK), `name`, `description`, `price` (`numeric(10,2) >= 0`), `status` (`'available' | 'occupied' | 'construction'`), `image_urls` (`text[]`), `sort_order` (`int`).
   - RLS: Public `SELECT` (`anon`, `authenticated`); `is_admin()` for writes.
2. **`public.tenants`**: `id` (uuid PK referencing `auth.users(id) on delete cascade`), `name`, `contact_info`.
   - RLS: Own row or `is_admin()` for `SELECT`; `is_admin()` for writes.
3. **`public.leases`**: `id` (uuid PK), `space_id` (`on delete restrict`), `tenant_id` (`on delete restrict`), `start_date`, `end_date` (`check (end_date > start_date)`), `monthly_rent` (`> 0`), `active` (`boolean`), `contract_files` (`text[]`).
   - Unique partial index: `leases_one_active_per_space` on `(space_id) where active`.
   - RLS: Own leases or `is_admin()` for `SELECT`; `is_admin()` for writes.
4. **`public.payments`**: `id` (uuid PK), `lease_id` (`on delete cascade`), `amount` (`> 0`), `payment_date` (`default current_date`), `period_month` (`1..12`), `period_year` (`2020..2100`), `receipt_path`, `status` (`'pending' | 'verified' | 'rejected'`), `admin_note`, `reviewed_at`.
   - Unique partial index: `payments_one_per_period` on `(lease_id, period_year, period_month) where status <> 'rejected'`.
   - RLS: Tenant can `SELECT` own lease payments and `INSERT` only when `status = 'pending'`, `admin_note is null`, `reviewed_at is null`, `split_part(receipt_path, '/', 1) = auth.uid()::text`, and lease is active & belongs to `auth.uid()`. `is_admin()` has full write access.

### Storage Buckets & Path Conventions
- **`spaces`** (public, 5 MB limit, `jpg/png/webp`): Public read; admin write. Path: `<spaceId>/<timestamp>-<rand>.<ext>`.
- **`receipts`** (private, 10 MB limit, images + PDF): Tenant inserts/reads under `<auth.uid()>/...`; admin full access. Path: `<tenantId>/<timestamp>-<rand>.<ext>`.
- **`contracts`** (private, 20 MB limit, images + PDF): Tenant selects when `(storage.foldername(name))[1] = lease.id::text`; admin full access. Path: `<leaseId>/<timestamp>-<rand>-<cleanBaseName>.<ext>`.

> **Config Limit**: `next.config.ts` sets `experimental.serverActions.bodySizeLimit: "15mb"` and enables `cacheComponents: true` and `partialPrefetching: true`.

---

## 4. Revalidation Matrix

Always revalidate all views affected by a mutation:
- **Space updated**: `revalidatePath("/admin")`, `revalidatePath("/")`
- **Lease created / updated / terminated**: `revalidatePath("/admin")`, `revalidatePath("/admin/contratos")`, `revalidatePath("/")`, `revalidatePath("/portal")`
- **Tenant / lease deleted or tenant updated**: `revalidateLeaseViews()` -> `/admin`, `/admin/contratos`, `/admin/pagos`, `/admin/historial`, `/`, `/portal`
- **Tenant submits payment**: `revalidatePath("/portal")` (and `/admin/pagos` if admin views cache/dynamic state — note `/admin` pages call `requireAdmin()` -> `connection()`)
- **Admin verifies / rejects / creates payment**: `revalidatePath("/admin")`, `revalidatePath("/admin/pagos")`, `revalidatePath("/admin/historial")`, `revalidatePath("/portal")`

---

## 5. Design Tokens & CSS Primitives (`src/app/globals.css`)

- **Fonts**: `--font-sans` (Jakarta Sans), `--font-display` (Fraunces).
- **Color Palette**:
  - `azul` (`#0b3d66`), `azul-oscuro` (`#06233b`)
  - `turquesa` (`#1693ad`), `turquesa-claro` (`#daf0f5`)
  - `barro` (`#b84a24`), `barro-claro` (`#f9e3d8`)
  - `maiz` (`#df9b1a`), `maiz-claro` (`#fdf0cf`)
  - `selva` (`#1f5e43`), `selva-claro` (`#d7eee2`)
  - `arena` (`#f8f4ec`), `crema` (`#e5dac7`), `tinta` (`#16202a`), `piedra` (`#52606d`)
  - `whatsapp` (`#25d366`), `whatsapp-oscuro` (`#111b21`)
- **Utilities**: `lenca-band`, `lenca-diamonds`, `blueprint-grid`, `hero-fluid-title`, `section-fluid-title`, `no-scrollbar`, `defer-section`.
- **Component Classes**: `.field`, `.label`, `.btn`, `.btn-primary`, `.btn-accent`, `.btn-whatsapp`, `.btn-ghost`, `.card`, `.eyebrow`.
- **UI Patterns**: Use `AdminDialog` (`<dialog>` with `showModal()` and `closedby="any"`) for modals and `useAdminToast()` (`AdminToastProvider` with `popover="manual"`) for feedback.
