# Plaza Aragón · Aplicación de Gestión de Locales Comerciales

> Sistema web integral de vitrina comercial, administración de contratos y gestión de cobranza digital para locales comerciales en Plaza Aragón (Olanchito, Yoro, Honduras).

Desarrollado con **Next.js 16 (App Router con Cache Components y Server Actions)**, **React 19**, **Tailwind CSS v4** y **Supabase (PostgreSQL, Auth con RLS y Storage)**.

---

## ⚡ Quick Start (Puesta en Marcha en <5 min)

### Prerrequisitos
- **Node.js**: Versión 20 o superior.
- **npm**: Gestor de paquetes incluido con Node.js.
- **Proyecto Supabase**: Proyecto activo en [supabase.com](https://supabase.com) o entorno local con Supabase CLI.

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/technetica/plaza-aragon.git
cd plaza-aragon
npm install
```

### 2. Configurar Variables de Entorno
Copie el archivo de plantilla `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```
Complete las credenciales de su proyecto Supabase y el número de atención comercial:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu-clave-anon-o-publishable>
SUPABASE_SECRET_KEY=<tu-clave-service-role>
NEXT_PUBLIC_WHATSAPP_NUMBER=504XXXXXXXX
NEXT_PUBLIC_SITE_URL=https://plaza-aragon.com
```

### 3. Inicializar Esquema y Datos de Prueba
1. **Esquema de Base de Datos:**
   Ejecute el script [supabase/schema.sql](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/supabase/schema.sql) en el SQL Editor de Supabase (crea tablas `spaces`, `tenants`, `leases`, `payments`, políticas RLS y buckets de almacenamiento `spaces`, `receipts` y `contracts`).
2. **Carga de Datos Iniciales (Seed):**
   ```bash
   npm run seed
   ```
   *(Alternativa SQL: ejecute directamente [supabase/seed.sql](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/supabase/seed.sql) en el SQL Editor de Supabase).*

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) en su navegador.

---

## 👥 Usuarios de Prueba y Credenciales de Demostración

| Rol / Tipo | Correo Electrónico | Contraseña | Perfil / Asignación | Ruta de Acceso |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador / Propietario** | `admin@plaza-aragon.com` | `Password123!` | Propietario Plaza Aragón (`role: admin`) | `/admin` |
| **Inquilino 1** | `inquilino1@plaza-aragon.com` | `Password123!` | Farmacia San José · Local 1 (L 8,000/mes) | `/portal` |
| **Inquilino 2** | `inquilino2@plaza-aragon.com` | `Password123!` | Café Olanchito · Local 2 (L 8,000/mes) | `/portal` |

---

## 🚀 Funcionalidades Principales

### 1. Vitrina Comercial Pública (`/`)
- **Explorador Interactivo de Locales (`CatalogExplorer`):** Filtros dinámicos (*Todos*, *Disponibles*, *En construcción*, *Ocupados*), contador en vivo y cálculo automático del rango de precios en Lempiras (HNL).
- **Galería Arquitectónica (`SpaceGallery`):** Visualizador fotográfico touch-friendly con soporte para navegación táctil, teclado y previsualización ampliada.
- **Detalle y Atributos de Locales:** Insignias de características (vitrina panorámica, porcelanato, medidor eléctrico independiente, baño privado, aire acondicionado).
- **Sección de Preguntas Frecuentes:** Condiciones de contrato (6 a 12+ meses renovables), cuotas mensuales y política de depósito en garantía (1 mes de cuota).
- **Contacto Directo:** Enlace directo de reserva y consultas por WhatsApp hacia el propietario.
- **Identidad Cultural Olanchiteña:** Paleta identitaria cálida (Azul Olanchito, Turquesa, Maíz, Selva, Barro y Arena) con créditos a Technetica.

### 2. Optimización para Motores de Búsqueda e Inteligencia Artificial (SEO / GEO / LLMs)
- **OpenGraph Dinámico:** Generación programática de tarjetas OpenGraph vía `src/app/opengraph-image.tsx`.
- **Sitemap y Robots Dinámicos:** Endpoints automáticos `sitemap.xml` y `robots.txt` que protegen rutas privadas (`/admin`, `/portal`) y otorgan acceso a rastreadores de IA (*OAI-SearchBot*, *PerplexityBot*, *ClaudeBot*).
- **Especificación LLMS.txt:** Archivos semánticos [public/llms.txt](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/public/llms.txt) y [public/llms-full.txt](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/public/llms-full.txt) para ingesta optimizada en modelos de lenguaje y agentes autónomos.

### 3. Portal de Inquilinos (`/portal`)
- **Sesión Segura:** Login con email y contraseña en `/ingresar`, gestionado por el proxy Next 16 `src/proxy.ts`.
- **Resumen de Arrendamiento:** Vista de cuota mensual, local arrendado, fecha de inicio y vencimiento de contrato.
- **Visualizador de Contrato y Anexos:** Acceso a documentos contractuales firmados (PDF e imágenes) mediante URLs firmadas con expiración de 1 hora.
- **Autoservicio de Cobranza:** Carga de comprobantes de transferencia bancaria directamente desde el móvil o cámara.
- **Compresión en Navegador (`compressImage`):** Optimización client-side mediante Canvas API que reduce imágenes antes del envío, protegiendo planes de datos móviles y almacenamiento. Límite máximo de subida de 4MB.
- **Historial de Pagos:** Registro histórico con insignias de estado (*Pendiente*, *Verificado*, *Rechazado*) y visualización de notas del administrador.

### 4. Panel de Propietario / Administrador (`/admin`)
- **Métricas de Ocupación e Ingresos:** Cuadros de mando con locales ocupados, disponibles, en construcción y recaudación mensual.
- **Gestión Integral de Locales (`EditSpaceModal`):** Edición completa de locales comerciales (nombre, estado, precio, orden de aparición, descripción y gestión de fotografías con carga al bucket `spaces`).
- **Verificación de Pagos (`/admin/pagos`):** Auditoría visual de comprobantes en alta resolución, aprobación con un clic o rechazo con retroalimentación explícita para el arrendatario.
- **Gestión de Contratos y Arrendatarios (`/admin/contratos`):** CRUD completo de inquilinos y contratos de arrendamiento, carga de contratos en PDF/imágenes al bucket privado `contracts`, terminación y eliminación de registros con diálogos de confirmación seguros.
- **Libro Contable Histórico (`/admin/historial`):** Libro contable cronológico con filtrado por año y mes.
- **Componentes de Retroalimentación:** Sistema de notificaciones toast (`AdminToast`), diálogos accesibles (`AdminDialog`) y navegación contextual (`AdminNav`).

---

## ⚙️ Configuración y Variables de Entorno

| Variable | Requerida | Propósito | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Sí** | URL del proyecto Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Sí** | Llave pública / anónima para SSR y cliente | `eyJhbGciOi...` |
| `SUPABASE_SECRET_KEY` | **Sí** | Llave de rol de servicio (solo servidor) para tareas de seed y consultas administrativas de auth | `eyJhbGciOi...` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **Sí** | Número de teléfono internacional para contacto directo | `50499999999` |
| `NEXT_PUBLIC_SITE_URL` | No | URL canónica para generación de sitemap y robots | `https://plaza-aragon.com` |

---

## 🛠️ Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en modo hot-reload (`localhost:3000`). |
| `npm run build` | Compila el proyecto para producción verificando tipos y rutas. |
| `npm run start` | Arranca el servidor de producción compilado. |
| `npm run lint` | Ejecuta ESLint sobre todo el proyecto para validar estándares de código. |
| `npm test` | Ejecuta la suite de pruebas automatizadas con el test runner nativo de Node.js. |
| `npm run seed` | Inicializa usuarios de prueba, espacios, contratos y comprobantes de muestra en Supabase. |

---

## 📚 Documentación Técnica Detallada

Para profundizar en los aspectos arquitectónicos, técnicos y filosóficos del proyecto, consulte los siguientes documentos:

- 📖 **[CODE_DOCUMENTATION.md](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/CODE_DOCUMENTATION.md)**: Arquitectura del sistema, flujo de autenticación vía `proxy.ts`, ciclo de vida de pagos, validaciones de dominio y guías de pruebas.
- 💡 **[DESIGN_PHILOSOPHY.md](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/DESIGN_PHILOSOPHY.md)**: Ideología del proyecto, principios Mobile-First, estética cultural hondureña y simplificación sin sobreingeniería.
- 📋 **[src/specs-dev/](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/src/specs-dev/)**: Especificaciones de requerimientos funcionales y diseño de interfaces.
- 🤖 **[AGENTS.md](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/AGENTS.md)**: Guía y directrices de codificación para agentes y modelos de IA colaboradores.

---

## 📝 Registro de Cambios (Changelog)

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased]

### Added
- Configuración de SEO y Generative Engine Optimization (GEO): `robots.ts`, `sitemap.ts`, OpenGraph dinámico (`opengraph-image.tsx`), y activos semánticos `public/llms.txt` y `public/llms-full.txt`.
- Suite de pruebas automatizadas en `src/lib/__tests__/` que cubre SEO, utilidades del catálogo, formateo monetario/fechas, compresión de imágenes y validaciones de dominio.
- Modal de edición integral de locales comerciales (`EditSpaceModal`) con gestión multi-imagen en Supabase Storage.
- Módulo de administración de contratos y arrendatarios (`/admin/contratos`) con subida de adjuntos PDF/imagen y visor accesible (`ContractAttachmentsView`).
- Sistema de notificaciones toast y componentes de navegación administrativa (`AdminToast`, `AdminNav`, `AdminDialog`).
- Atributos y filtros del explorador de catálogo (`catalog.ts`), soporte de FAQ sobre depósito de garantía y créditos Technetica.
- Plantilla de variables de entorno `.env.example`.

### Changed
- Reemplazo de middleware tradicional por el proxy nativo de Next.js 16 (`src/proxy.ts`) para gestión de sesiones Supabase y redirección según rol.
- Normalización de nomenclatura comercial: adopción del término «cuota mensual» en reemplazo de «canon».
- Reorganización de componentes administrativos y desacoplamiento de utilidades de dominio (`validation.ts`, `catalog.ts`, `format.ts`).
- Mejora de estilos en formularios de pago y distintivos de estado con Tailwind CSS v4.

### Fixed
- Corrección de escalado en navegación móvil y soporte de áreas táctiles mínimas de 44px.
- Saneamiento de nombres de archivos en almacenamiento mediante `sanitizeStorageFileName` para prevenir fallos con caracteres especiales.
- Manejo seguro de rangos numéricos y fechas en el cálculo de periodos fiscales y días restantes.

---

## 📄 Licencia

Privado © Plaza Aragón / Technetica. Todos los derechos reservados.
