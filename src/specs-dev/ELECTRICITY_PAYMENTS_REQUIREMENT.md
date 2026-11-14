# Especificación de Requerimiento: Verificación Mensual de Energía Eléctrica, Alertas de Morosidad e Historial Separado

## 1. Contexto y Objetivo

En **Plaza Aragón** (Olanchito, Yoro, Honduras), cada arrendatario es responsable de pagar mensualmente el servicio de energía eléctrica correspondiente al módulo comercial que ocupa. Para garantizar que los módulos se mantengan al día con el suministro eléctrico y evitar cortes o saldos acumulados asociados al inmueble, la administración necesita verificar cada mes el recibo pagado por el inquilino.

El sistema debe integrar la recepción y verificación de comprobantes de energía eléctrica en el flujo existente sin mezclar bajo ningún concepto estos montos con la **cuenta de ingresos por renta mensual** del propietario. Adicionalmente, si un arrendatario acumula tres meses consecutivos sin subir recibo de energía eléctrica, el panel administrativo debe alertar de forma proactiva y ofrecer un historial claro de pagos pasados por módulo e inquilino.

---

## 2. Alcance Funcional y Reglas de Negocio

### 2.1. Separación Estricta de Cuentas (`payment_type`)
Todo registro en `public.payments` incorpora el discriminador `payment_type`:
- `'rent'`: Cuota mensual de arrendamiento (ingreso propio de Plaza Aragón).
- `'electricity'`: Recibo de pago de energía eléctrica del módulo arrendado (obligación de servicio público del inquilino).

Reglas obligatorias:
1. **Unicidad por período y tipo:** Cada contrato (`lease_id`) puede tener máximo **un comprobante no rechazado** de `'rent'` y **un comprobante no rechazado** de `'electricity'` por cada mes/año (`(lease_id, payment_type, period_year, period_month) where status <> 'rejected'`). Subir el recibo de luz no bloquea ni sustituye el pago de la cuota mensual de renta.
2. **Monto obligatorio del recibo:** Para ambos tipos se exige `amount > 0` en Lempiras hondureños (`HNL`) y archivo de respaldo (fotografía optimizada o PDF). En el caso de energía eléctrica, el formulario no prellena la `cuota mensual` del contrato y solicita el monto exacto facturado en el recibo (ej. factura ENEE).
3. **Aislamiento financiero absoluto:** Los indicadores de recaudación de renta en `/admin` (*Recaudado del mes*, *Meta activa*, porcentaje de cobro) y los totales/gráficos principales de renta en `/admin/historial` filtran estrictamente `payment_type = 'rent'`. Los montos de energía eléctrica únicamente se totalizan dentro de su propia vista separada.

### 2.2. Portal del Inquilino (`/portal`)
1. **Selector de Tipo de Comprobante:** En `PaymentForm`, el inquilino elige mediante un control segmentado entre **Cuota de Renta** (`rent`) y **Energía Eléctrica** (`electricity`), adaptando dinámicamente etiquetas, marcador de monto y soporte para fotografías o documentos PDF.
2. **Indicadores del Mes en Curso:** La cabecera de `/portal` muestra simultáneamente el estado del mes actual para **Cuota Mensual** y **Energía Eléctrica**.
3. **Aviso al Inquilino por Atraso:** Si el contrato del inquilino califica dentro de la regla de morosidad de 3 meses sin recibos de energía eléctrica, se muestra un aviso destacado en su portal con acceso directo al formulario de carga.
4. **Historial Separado:** `PaymentHistory` incluye pestañas independientes (*Renta Mensual* y *Energía Eléctrica*) con sus propios contadores, filtros por año/estado y vista de 12 meses.

### 2.3. Panel de Administración (`/admin`, `/admin/pagos`, `/admin/historial`)
1. **Regla de Notificación por Falta de Carga (3 Meses):**
   - Evaluada en zona horaria `America/Tegucigalpa` (`currentPeriod()`) sobre la ventana de los últimos 3 períodos mensuales consecutivos: `[shiftPeriod(cur, -2), shiftPeriod(cur, -1), cur]`.
   - Solo aplica a contratos activos cuya fecha de inicio (`periodOfDate(lease.start_date)`) sea anterior o igual al inicio de la ventana de 3 meses (`shiftPeriod(cur, -2)`), evitando falsas alertas en contratos recién firmados.
   - Un contrato activo dispara la notificación cuando no tiene ningún registro de tipo `'electricity'` con estado `'verified'` o `'pending'` dentro de esos 3 períodos (los recibos `'rejected'` o los pagos de `'rent'` no satisfacen el requisito).
   - La notificación aparece de forma visible tanto en `/admin` (Resumen Operativo) como en `/admin/pagos`, detallando módulo comercial, nombre del inquilino, contacto, los 3 períodos faltantes y enlace directo a `/admin/pagos?tipo=electricity`.
2. **Verificación Integrada y Separada (`/admin/pagos`):**
   - Comparte la misma página de *Verificación de Pagos*, dividida mediante pestañas de URL (`?tipo=rent` y `?tipo=electricity`) con contadores de pendientes independientes para cada cuenta.
   - Cada `PaymentReviewCard` muestra una insignia de categoría (`Renta Mensual` vs. `Energía Eléctrica`) y permite aprobar (`Verificado`) o rechazar con observación al igual que el flujo de renta.
   - El modal `CreatePaymentModal` permite a administración registrar manualmente un recibo verificado de renta o de energía eléctrica.
3. **Resumen Histórico de Pagos de Energía Eléctrica:**
   - En `/admin/pagos?tipo=electricity`, además de la cola de revisión mensual, se despliega una matriz anual de cumplimiento por inquilino y local comercial (*12 meses del año seleccionado*) junto con los pagos pasados reportados, su monto y enlace directo al comprobante.
   - En `/admin/historial`, el selector `?tipo=rent` / `?tipo=electricity` permite consultar el libro histórico anual de cada cuenta de manera estrictamente separada.

---

## 3. Experiencia de Usuario (UX) y Diseño Mobile-First (`/enhance_ui`)

- **Identidad Visual Plaza Aragón:** Uso consistente de los tokens de color Olanchito (`azul`, `turquesa`, `barro`, `maiz`, `selva`, `arena`, `crema`, `tinta`, `piedra`) y tipografía (`--font-display`, `--font-sans`).
- **Ergonomía Móvil (`360px`+):** Navegación por pestañas, selectores segmentados, tarjetas y matriz de 12 meses operables desde pantallas de `360px` sin desbordamiento horizontal; áreas táctiles mínimas de `44px` (`min-h-11` / `min-h-12`).
- **Microinteracciones y Accesibilidad:** Transiciones suaves (`transition-all duration-200`), estados hover/active definidos, foco visible para navegación por teclado (`:focus-visible`) y atributos `aria-pressed` / `aria-current` / `role="alert"` apropiados.
- **Idioma y Terminología:** 100% en español natural de Honduras (*«cuota mensual»*, *«energía eléctrica»*, *«local comercial»*, *«arrendatario»*, *«comprobante»*).

---

## 4. Arquitectura Técnica y Datos

### 4.1. Base de Datos y Supabase RLS
- **Migración:** `supabase/migrations/20261114160000_add_electricity_payments.sql` + sincronización en `supabase/schema.sql`.
- **Columna e Índices:**
  - `payment_type text not null default 'rent' check (payment_type in ('rent', 'electricity'))`
  - Índice único parcial `payments_one_per_period` sobre `(lease_id, payment_type, period_year, period_month) where status <> 'rejected'`.
  - Índice de apoyo `payments_type_period_idx` sobre `(payment_type, period_year, period_month)`.
- **Seguridad:** Las políticas RLS existentes en `public.payments` y el bucket privado `receipts` continúan garantizando que cada inquilino solo inserte comprobantes pendientes para su propio contrato activo y que únicamente `public.is_admin()` verifique o rechace registros.

### 4.2. Capa de Dominio y Acciones de Servidor
- **Tipos (`src/lib/types.ts`):** `PaymentType = "rent" | "electricity"`, integrado en `Payment`.
- **Validación (`src/lib/validation.ts`):** `isValidPaymentType()`, `validatePaymentInput()`, `validateAdminPaymentInput()`.
- **Lógica Pura (`src/lib/format.ts`):** `getElectricityDelinquentLeases()` con cobertura de pruebas unitarias en `src/lib/__tests__/format.test.ts` y `src/lib/__tests__/validation.test.ts`.
- **Revalidación (`revalidatePath`):** Cada envío, verificación, rechazo o registro manual revalida `/portal`, `/admin`, `/admin/pagos` y `/admin/historial`.

### 4.3. Reglas de Codificación
- Mantener la arquitectura directa sin librerías externas innecesarias.
- Preservar intacta la compresión de imágenes (`compressImage()`), el manejo de PDFs, `AdminDialog` y `useAdminToast()`.
- Cero comentarios superfluos en el código fuente.

---

## 5. Criterios de Aceptación

1. **Carga Mensual del Inquilino:** Un inquilino puede subir un comprobante de renta y un comprobante de energía eléctrica para el mismo mes y año sin colisión ni reemplazo mutuo.
2. **Verificación en Administración:** El administrador puede revisar, verificar y rechazar comprobantes de energía eléctrica desde `/admin/pagos?tipo=electricity`, manteniendo estrictamente separada la cuenta de renta (`?tipo=rent`).
3. **Aislamiento Contable:** Los totales de recaudación de renta en `/admin` y `/admin/historial?tipo=rent` nunca incluyen montos de recibos de energía eléctrica.
4. **Notificación por 3 Meses sin Carga:** Un contrato activo con al menos 3 meses de vigencia y sin recibos de electricidad (`pending` o `verified`) en los últimos 3 meses genera la notificación automática tanto en `/admin` como en `/admin/pagos`, desapareciendo en cuanto se registra un recibo válido dentro de la ventana.
5. **Resumen Histórico de Electricidad:** El administrador dispone de una vista anual de cumplimiento mensual por inquilino/local en `/admin/pagos?tipo=electricity` y un historial separado en `/admin/historial?tipo=electricity`.
6. **Calidad y Diseño Responsivo:** `npm test`, `npm run lint` y `npm run build` finalizan sin errores, y todas las vistas son usables desde `360px` hasta escritorio.
