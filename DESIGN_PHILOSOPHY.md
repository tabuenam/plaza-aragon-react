# Filosofía de Diseño e Ideología · Plaza Aragón

> *"La tecnología tiene verdadero valor cuando resuelve problemas cotidianos de personas reales con dignidad, simplicidad y arraigo local."*

---

## 🎯 1. Visión y Propósito: ¿Por qué existe Plaza Aragón?

En muchas ciudades intermedias de América Latina, como **Olanchito, Yoro, Honduras**, la gestión de inmuebles comerciales ha dependido históricamente de métodos informales y fragmentados:
- Envío de capturas de depósitos bancarios a través de chats personales de WhatsApp que se pierden con el tiempo.
- Falta de un registro unificado donde un arrendatario pueda verificar si su pago mensual fue acreditado o si tiene saldo pendiente.
- Ausencia de una vitrina comercial digital atractiva que permita a profesionales, médicos y emprendedores conocer los locales disponibles y proyectar su negocio.

**Plaza Aragón** no busca ser un software inmobiliario corporativo complejo ni una plataforma sobrecargada de microservicios. Su propósito es **crear un puente digital transparente, cálido y altamente confiable** entre el propietario del edificio y sus inquilinos.

---

## 💎 2. Principios Rectores (Core Ideology)

### 📱 1. Realismo Mobile-First: Diseñado para la Calle y el Teléfono
- **El contexto real manda:** La mayor parte de los pagos se realizan desde la fila de un banco o la aplicación móvil de un banco hondureño (Ficohsa, BAC, Atlántida, Banpaís). El inquilino toma una captura de pantalla en su teléfono y la sube en el acto.
- **Respeto al plan de datos móviles:** No obligamos al usuario a subir imágenes crudas de 12 megapíxeles. La aplicación implementa compresión en el cliente (`compressImage`) antes de transmitir un solo byte, minimizando el consumo de datos celulares y asegurando que la carga sea rápida incluso en redes 3G o 4G inestables.
- **Ergonomía táctil:** Cualquier control, selector o botón interactivo cumple un tamaño mínimo de toque de 44px (`min-h-11`), permitiendo que el propietario o inquilino opere el sistema con una sola mano mientras camina por el inmueble.

### 🌿 2. Identidad Cultural, Orgullo Local y Cercanía
- **Colores con memoria y pertenencia:** La paleta de diseño de Plaza Aragón huye del gris corporativo genérico. Abraza los tonos cálidos del Valle del Aguán y la identidad olanchiteña: el azul firme del cielo, el turquesa fresco, el maíz dorado de los campos, el verde selva de las montañas y los tonos arena y barro de los materiales arquitectónicos.
- **Lenguaje natural y directo:** 100% en español, utilizando términos claros como *«cuota mensual»*, *«local disponible»*, *«comprobante de transferencia»* y *«depósito en garantía»*, desterrando anglicismos innecesarios o jerga legal inaccesible.

### 🛡️ 3. Dignidad, Transparencia y Cuentas Claras
- **Cobranza sin fricciones ni malentendidos:** Cuando un inquilino sube su recibo bancario, el sistema registra la fecha exacta y lo deja en estado *Pendiente*. Al ser revisado, pasa a *Verificado* o a *Rechazado* con una nota explícita explicando la razón (por ejemplo, *«Monto incompleto o número de referencia ilegible»*).
- **Tranquilidad jurídica:** El inquilino tiene acceso permanente a su contrato activo y anexos firmados en PDF o imagen de alta resolución, garantizando que ambas partes cuenten con las mismas reglas de juego.

### ⚡ 4. Simplicidad Radical y Cero Sobreingeniería
- **Aprovechar la plataforma:** Se rechazan las dependencias externas superfluas. Se utiliza Next.js 16 nativo (Cache Components, Server Actions, `proxy.ts`), React 19 nativo y las fortalezas de PostgreSQL con Row Level Security (RLS) en Supabase.
- **Cero comentarios innecesarios en código:** El código fuente debe ser limpio, autoexplicativo y conciso. El software bien estructurado expresa la intención del negocio a través de nombres significativos y funciones puras desacopladas.
- **Suite de pruebas nativa y ligera:** Las pruebas automatizadas corren con el ejecutor nativo de Node.js (`node --test`), evitando librerías pesadas y asegurando tiempos de ejecución casi instantáneos (<300 ms).

### 🤖 5. Preparación para la Era de la IA (Generative Engine Optimization)
- Creemos que los futuros clientes no solo buscarán locales en motores de búsqueda tradicionales, sino mediante asistentes conversacionales y agentes inteligentes (como Perplexity, ChatGPT o Claude).
- Plaza Aragón lidera la adopción de los estándares web abiertos de la IA:
  - Archivos semánticos [public/llms.txt](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/public/llms.txt) y [public/llms-full.txt](file:///Users/juan-jose.tabuena-mejia/Documents/dev/technetica/plaza-aragon/public/llms-full.txt) que facilitan a los modelos de lenguaje entender la oferta de la plaza en una sola pasada.
  - Reglas en `robots.txt` que dan la bienvenida a los rastreadores de IA en las áreas públicas, mientras resguardan firmemente los datos privados de los inquilinos.

---

## 🧭 3. Razonamiento de Decisiones de Diseño Recientes

| Decisión Reciente | Problema que Resuelve | Justificación Filosófica |
| :--- | :--- | :--- |
| **Migración de «Canon» a «Cuota Mensual»** | El término «canon» sonaba distante y formalista para el día a día en Olanchito. | Acercar el producto a las palabras cotidianas de los arrendatarios locales. |
| **Modal integral de edición de locales (`EditSpaceModal`)** | El propietario no podía actualizar fotos ni descripciones conforme avanzaban las obras del edificio. | Empoderar al dueño para mantener la vitrina al día en tiempo real sin llamar a un desarrollador. |
| **Compresión client-side en Canvas** | Envíos fallidos de comprobantes por fotos de 8MB en conexiones celulares lentas. | Priorizar la accesibilidad y economía de datos del inquilino antes de requerir mayor infraestructura. |
| **Visor seguro de contratos (`ContractAttachmentsView`)** | Pérdida de copias físicas de contratos firmados. | Centralizar los acuerdos legales con URLs firmadas efímeras (1 hora), protegiendo la privacidad. |
| **Transición de middleware a `src/proxy.ts` (Next 16)** | Obsolescencia técnica de middlewares tradicionales en App Router 16. | Mantener el stack en la vanguardia tecnológica oficial sin parches temporales. |

---

## 🌟 4. Conclusión

Plaza Aragón demuestra que una aplicación de software no necesita ser masiva ni hipercompleja para tener un impacto transformador. Diseñada con empatía, austeridad técnica y respeto al usuario, convierte un proceso estresante como el cobro y la renta de espacios comerciales en una experiencia ágil, moderna y digna.
