# Especificación de Requerimiento: Edición Integral de Locales Comerciales

## 1. Contexto y Objetivo

En la versión actual de **Plaza Aragón**, el administrador solo puede alternar de manera limitada el estado (*disponible, ocupado, en construcción*) y el precio de cada local mediante un formulario rápido en el panel.

Para mantener actualizada la vitrina comercial en `plaza-aragon.com` conforme avanzan las obras y cambian las condiciones de arrendamiento en Olanchito, el administrador necesita la capacidad de **modificar integralmente todos los atributos de cada local** de manera intuitiva, rápida y optimizada para dispositivos móviles y de escritorio.

---

## 2. Alcance Funcional y Campos Editables

El sistema permitirá al administrador editar los siguientes campos del modelo `spaces`:

| Campo | Tipo | Requerido | Descripción y Reglas de Negocio |
| :--- | :--- | :--- | :--- |
| **Nombre** (`name`) | Texto | Sí | Nombre identificador del espacio (ej. *"Local 1 - Esquinero Principal"*). Mínimo 3 caracteres. |
| **Estado** (`status`) | Selector | Sí | `available` (Disponible), `occupied` (Ocupado), `construction` (En construcción). Refleja disponibilidad en la web pública. |
| **Precio mensual** (`price`) | Numérico | Sí | Monto base de alquiler en Lempiras hondureños (HNL). Debe ser mayor o igual a 0. |
| **Orden de aparición** (`sort_order`) | Entero | Sí | Número que determina la posición del local en la vitrina pública y en el panel. |
| **Descripción** (`description`) | Texto largo | No | Detalle comercial de dimensiones, acabados, preparación eléctrica/A/C y beneficios para atraer arrendatarios. |
| **Galería de fotos** (`image_urls`) | Lista de URLs | No | Fotografías del local almacenadas en el bucket público `spaces` de Supabase Storage. Permite subir nuevas fotos y eliminar fotos existentes. |

---

## 3. Especificación de Experiencia de Usuario (UX) y Diseño de Interfaz (UI)

### 3.1. Filosofía de Diseño
* **Mobile-First & Touch-Friendly:** El propietario a menudo inspecciona la plaza desde su teléfono celular. Todos los campos de entrada, botones de acción y zonas de carga deben tener un área táctil mínima de 44px (`min-h-11`).
* **Estética Plaza Aragón:** Uso coherente de la paleta identitaria (Azul `#0d4a7a`, Turquesa `#1fa9c4`, Maíz `#e5a82a`, Selva `#2a6547`, Barro `#b9542a`, Arena `#faf6ef`, Crema `#efe5d4`).
* **Flujo no invasivo (Modal / Bottom Sheet):** En lugar de navegar a una página independiente que rompa el flujo de trabajo en el panel, se utilizará un diálogo accesible (`EditSpaceModal`) que en móviles se despliega como hoja inferior o pantalla completa adaptada, y en escritorio como modal centrado con fondo desenfocado (`backdrop-blur-sm`).

### 3.2. Estructura del Componente del Formulario
1. **Cabecera del Modal:**
   * Título con fuente display: *"Editar [Nombre del Local]"*.
   * Indicador del identificador y botón accesible de cierre (X).
2. **Sección 1: Información General:**
   * Campo de texto para el *Nombre del local*.
   * Campo numérico para el *Orden de visualización* (con explicación corta: *"Posición en el listado"*).
3. **Sección 2: Disponibilidad y Precio:**
   * Selector estilizado de *Estado* con insignias visuales (Verde para Disponible, Gris para Ocupado, Ámbar para En construcción).
   * Entrada de *Precio mensual (HNL)* con formato claro y paso numérico de 100 Lps.
4. **Sección 3: Descripción Comercial:**
   * Área de texto multilínea (4 a 5 filas) con texto de ayuda (*"Describa acabados, dimensiones, iluminación..."*).
5. **Sección 4: Gestión Fotográfica:**
   * Cuadrícula de fotos actuales con miniaturas y botón de eliminación rápida (ícono de papelera sobre cada foto).
   * Zona de carga interactiva (*drag & drop* o botón para seleccionar fotos de la galería del teléfono) que realiza compresión previa en el navegador antes de subir.
6. **Pie de Acciones:**
   * Botón secundario: *"Cancelar"*.
   * Botón principal (`btn-primary`): *"Guardar Cambios"*, con estado de carga interactivo (*"Guardando…"*) que inhabilita envíos duplicados.

### 3.3. Estados y Microinteracciones
* **Validación en vivo:** Mensajes de error amigables en español si el nombre está vacío o el precio es negativo.
* **Confirmación visual:** Notificación de éxito temporal al guardar los cambios antes de cerrar o actualizar la vista.
* **Actualización instantánea:** Revalidación automática del panel (`/admin`) y de la página principal (`/`) tras completar la mutación.

---

## 4. Arquitectura Técnica y Datos

### 4.1. Stack y Tecnologías
* **Framework:** Next.js (App Router con Server Actions).
* **React:** React 19 (`useActionState`, `useTransition`, `useState`, `useRef`).
* **Estilos:** Tailwind CSS v4, componentes utilitarios del proyecto (`.field`, `.label`, `.btn-primary`, `.card`).
* **Base de datos & Storage:** Supabase PostgreSQL (`public.spaces`) y Supabase Storage (`spaces` bucket con políticas existentes de `is_admin()`).
* **Optimización de Medios:** Utilidad existente de compresión de imágenes en el cliente (`compressImage`).

### 4.2. Flujo de Datos y Server Action
1. El usuario abre el modal desde la tarjeta del local en `/admin`.
2. El modal inicializa su estado con los datos actuales del local (`Space`).
3. El administrador modifica campos de texto, elimina fotos existentes y/o añade fotos nuevas.
4. Las fotos nuevas son comprimidas en el cliente y subidas al bucket `spaces` de Supabase Storage.
5. Se invoca el Server Action `updateSpaceAction` recibiendo:
   * `space_id`: UUID del local.
   * `name`: Nombre actualizado.
   * `description`: Descripción comercial.
   * `price`: Monto numérico.
   * `status`: Estado del local (`available` | `occupied` | `construction`).
   * `sort_order`: Posición en la lista.
   * `image_urls`: Arreglo ordenado con las URLs finales de imágenes.
6. El Server Action valida los permisos de administrador mediante `requireAdmin()`, actualiza el registro en `public.spaces` y ejecuta `revalidatePath('/admin')` y `revalidatePath('/')`.

### 4.3. Reglas de Codificación Obligatorias
* **Cero comentarios:** El código no contendrá comentarios ni anotaciones Javadoc.
* **Sin sobreingeniería:** Mantener la arquitectura simple, directa y sin librerías externas superfluas.
* **Idioma estricto:** 100% de la interfaz de usuario, etiquetas y mensajes de error en español.

---

## 5. Criterios de Aceptación

1. **Edición Completa:** El administrador puede modificar nombre, descripción, precio, estado y orden de cualquier local.
2. **Gestión de Fotografías:** El administrador puede subir nuevas imágenes y remover imágenes existentes de un local, viéndose reflejadas de inmediato en la galería pública de `plaza-aragon.com`.
3. **Persistencia & Seguridad:** Únicamente usuarios con rol de administrador autenticados pueden ejecutar la mutación (protegido por RLS y `requireAdmin()`).
4. **Diseño Responsivo:** El modal y los controles son completamente operables en pantallas móviles de 360px de ancho y en pantallas de escritorio.
5. **Revalidación:** Al guardar, los cambios se reflejan inmediatamente en el panel administrativo y en el catálogo público sin necesidad de recargar la página manualmente.
