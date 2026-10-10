# Plaza Aragón · Aplicación de Gestión de Locales Comerciales

Aplicación web desarrollada con Next.js (App Router), Tailwind CSS y Supabase para la administración de locales comerciales en Plaza Aragón, Olanchito, Yoro, Honduras.

## Características

### 1. Portal Público (`plaza-aragon.com`)
* Catálogo de los 5 espacios comerciales (2 ocupados, 3 en construcción).
* Información de cada local: nombre, precio en Lempiras (HNL), estado de ocupación, descripción y galería de fotos adaptable a móviles.
* Contacto y reservas directas a través de WhatsApp.
* Identidad visual moderna inspirada en Olanchito y la cultura hondureña.

### 2. Portal de Inquilinos (`/portal`)
* Inicio de sesión seguro con correo electrónico y contraseña (`/ingresar`).
* Consulta del contrato activo y monto de renta mensual.
* Registro de pagos con subida de comprobantes de transferencia bancaria directa desde la cámara del teléfono o la galería de imágenes con compresión previa en el navegador.
* Historial de pagos con estado de revisión (Pendiente, Verificado, Rechazado) y visualización del comprobante.

### 3. Panel de Propietario / Administrador (`/admin`)
* Resumen de ocupación y métricas de cobro del mes en curso.
* Módulo de verificación de pagos (`/admin/pagos`): visualización de comprobantes bancarios en alta resolución, aprobación ("Verificado") o rechazo con motivo para el inquilino.
* Libro contable histórico (`/admin/historial`): registro cronológico de todas las transferencias realizadas durante el año.
* Modificación de disponibilidad y precios de los locales.

## Usuarios de Prueba y Desarrollo Local

Para pruebas locales y demostración del sistema se han configurado los siguientes usuarios de prueba:

| Rol / Tipo | Correo Electrónico | Contraseña | Perfil / Espacio Asignado | Acceso |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador / Propietario** | `admin@plaza-aragon.com` | `Password123!` | Administrador Plaza Aragón (`role: admin`) | `/admin` |
| **Inquilino 1** | `inquilino1@plaza-aragon.com` | `Password123!` | Farmacia San José · Local 1 (L 8,000/mes) | `/portal` |
| **Inquilino 2** | `inquilino2@plaza-aragon.com` | `Password123!` | Café Olanchito · Local 2 (L 8,000/mes) | `/portal` |

### Inicialización de Usuarios y Datos de Prueba

Existen dos formas equivalentes de inicializar estos usuarios y sus contratos en su base de datos Supabase:

1. **Vía SQL (Recomendado para Supabase Cloud / Dashboard):**
   Ejecute el script `supabase/seed.sql` en el SQL Editor de Supabase. Este script crea los usuarios en `auth.users`, sus identidades, sus perfiles en `tenants`, contratos activos en `leases` y pagos de muestra.

2. **Vía Script Node.js:**
   Con las variables de entorno configuradas en `.env.local` (incluyendo `SUPABASE_SECRET_KEY`), ejecute:
   ```bash
   npm run seed
   ```

## Pila Tecnológica

* **Framework:** Next.js 16 (App Router con Cache Components y Partial Prefetching).
* **Estilos:** Tailwind CSS v4 con diseño móvil prioritario.
* **Base de Datos y Almacenamiento:** Supabase (PostgreSQL, Auth con RLS, Storage para comprobantes y fotos).
* **Despliegue:** Vercel.

## Configuración y Puesta en Marcha

### 1. Variables de Entorno

Copie el archivo de ejemplo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Defina las claves correspondientes:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu-clave-anon-o-publishable>
SUPABASE_SECRET_KEY=<tu-clave-service-role>
NEXT_PUBLIC_WHATSAPP_NUMBER=504XXXXXXXX
```

### 2. Base de Datos en Supabase

Ejecute el script SQL ubicado en `supabase/schema.sql` en el editor SQL de su proyecto Supabase. Este script creará:
* Las tablas `spaces`, `tenants`, `leases` y `payments`.
* Las políticas de seguridad a nivel de fila (Row Level Security - RLS).
* Los buckets de almacenamiento `receipts` (privado) y `spaces` (público).

Luego cargue los datos iniciales y usuarios de prueba ejecutando `supabase/seed.sql` o ejecutando `npm run seed`.

### 3. Ejecución del Proyecto

Instalar dependencias:
```bash
npm install
```

Poblar usuarios y datos de prueba:
```bash
npm run seed
```

Iniciar el servidor de desarrollo:
```bash
npm run dev
```

Compilar para producción:
```bash
npm run build
```

Ejecutar validación de código:
```bash
npm run lint
```
