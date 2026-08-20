# v2 — Requerimientos: Mensajería (WhatsApp, correo, verificación por código)

> Consolida en un solo documento tres pendientes que ya existían dispersos en `03_REQUERIMIENTOS_PORTAL_CLIENTE.md` (RF-PC-10) y `07_REQUERIMIENTOS_COMBOS_VENTAS.md` (§6, Bloque 3), más un pedido nuevo (notificaciones al staff por correo). Los tres comparten la misma causa raíz — el sistema no tiene hoy ninguna integración de mensajería externa — y se benefician de una sola arquitectura en vez de tres integraciones ad-hoc. No reemplaza esos documentos, los extiende y en el caso del Bloque 3 **actualiza el diseño técnico** (ver §5).

## 1. Alcance — 3 casos de uso

1. **Envío del enlace del portal de pedidos regulares por WhatsApp** (`03_REQUERIMIENTOS_PORTAL_CLIENTE.md`, RF-PC-10) — hoy solo existe el envío manual (copiar/pegar, RF-PC-09, ✅ implementado).
2. **Portal público de combos** (`07_REQUERIMIENTOS_COMBOS_VENTAS.md §6`, Bloque 3) — pide correo o teléfono, verifica con un código antes de confirmar el pedido. El diseño original solo contemplaba correo; este documento lo amplía para que el código también pueda enviarse por WhatsApp/SMS, ya que de todas formas se va a integrar un proveedor de mensajería para el caso 1.
3. **Notificaciones al staff por correo electrónico** (pedido nuevo de esta sesión) — el centro de notificaciones interno (`notifications`, `20260817_notifications_center.sql`) ya tiene la columna `emailed_at` reservada sin usar, previendo justamente este caso.

## 2. Investigación de proveedores (2026-08-19)

### WhatsApp

Hay dos caminos, no mutuamente excluyentes con el tiempo:

- **Meta Cloud API directa**: sin markup de terceros, se paga solo la tarifa de Meta por mensaje. A cambio, no da nada más que la API — inbox, manejo de webhooks, reintentos, todo eso hay que construirlo y mantenerlo.
- **BSP (Business Solution Provider) como Twilio, 360dialog, etc.**: capa gestionada sobre la misma plataforma de Meta. Twilio, por ejemplo, agrega **+US$0.005 por mensaje** (enviado o recibido) sobre la tarifa de Meta, sin mínimo mensual, a cambio de un SDK simple, sandbox de pruebas y (relevante para el caso 2) la API de verificación por código ya resuelta.

**Recomendación**: Twilio. Oasis no necesita un inbox conversacional ni un chatbot — el caso de uso es "mandar una plantilla aprobada con un enlace o un código", que es exactamente lo que un BSP simplifica. El ahorro de no pagar el markup de Twilio no compensa el trabajo de integrar y mantener la API cruda de Meta para este volumen.

**Requisito ineludible, no técnico**: para usar cualquiera de las dos vías hace falta:
- Una cuenta de **Meta Business Manager** con **verificación de negocio** completada (documentos legales de Oasis) — proceso de **3 a 10 días hábiles**.
- Un **número de teléfono dedicado**, que no esté activo hoy en WhatsApp normal ni en WhatsApp Business App.
- **Cada plantilla de mensaje debe aprobarse individualmente** antes de poder enviarse (24-48h por plantilla) — no se puede mandar texto libre a un número que no te escribió primero.

**Restricción de contenido encontrada, importante para el diseño**: WhatsApp tiene 3 categorías de plantilla (Marketing, Utility, Authentication) y **las plantillas de categoría "Authentication" no permiten URLs, medios ni emojis** en su contenido — están pensadas solo para códigos. Esto significa que:
- El enlace del portal (caso 1) debe enviarse con una plantilla **Utility**.
- El código de verificación (caso 2) debe enviarse con una plantilla **Authentication** (además, es la categoría más barata).
- **No se pueden combinar** en un solo mensaje tipo "acá tenés tu enlace y tu código" — son dos plantillas y probablemente dos envíos.

### Correo transaccional

Se mantiene la recomendación ya hecha en `07_REQUERIMIENTOS_COMBOS_VENTAS.md`: **Resend**. Tiene una integración de referencia oficial con Supabase Edge Functions (mismo patrón que ya usa `generate-combo-image`, la única función existente que llama a una API externa), plan gratuito con límite bajo y planes pagos desde ~US$20/mes. No se encontró ninguna razón para reconsiderar esta elección frente a alternativas como SendGrid o Postmark — ninguna aporta algo que Oasis necesite y no tenga Resend.

### Verificación por código (OTP) — opción encontrada que simplifica el diseño original

El diseño original del Bloque 3 (`combo_public_requests`/`email_outbox` armados a mano) asumía que había que construir la lógica de generar el código, expirarlo, limitar reintentos y registrar el envío. **Twilio tiene un producto dedicado a esto, Verify API**, que hace exactamente eso como servicio (SMS, WhatsApp o correo, mismo endpoint, cambiando solo el canal) — genera el código, lo entrega, expira, limita intentos y confirma la validación, sin guardar el código en la base de Oasis.

**Recomendación**: si de todas formas se va a integrar Twilio para el caso 1 (WhatsApp), usar también **Twilio Verify** para el OTP del caso 2 en vez de un `email_outbox` construido a mano — es exactamente el tipo de lógica de seguridad (expiración, límite de intentos, prevención de fuerza bruta) que conviene no reinventar. Esto **reemplaza** la parte de generación/validación de código del diseño original de `07_REQUERIMIENTOS_COMBOS_VENTAS.md §6` (el resto del diseño — pedir correo/teléfono, resolver/crear el cliente después de verificar, sin pago en línea — se mantiene sin cambios).

### Fuentes consultadas
- [WhatsApp Business API Pricing: 2026 Complete Cost Guide](https://www.engagelab.com/blog/whatsapp-business-api-pricing)
- [Meta API vs Twilio API for Dynamics 365 WhatsApp](https://www.inogic.com/blog/2026/07/meta-api-vs-twilio-api-which-whatsapp-integration-fits-your-dynamics-365-strategy/)
- [WhatsApp Business API 2026: Complete Guide to Setup, Cloud API, Chatbots, Pricing and BSPs](https://www.messagecentral.com/blog/whatsapp-business-api-complete-guide)
- [Verify API | Twilio](https://www.twilio.com/en-us/user-authentication-identity/verify)
- [Verify WhatsApp Overview | Twilio](https://www.twilio.com/docs/verify/whatsapp)
- [Template categorization - Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization)
- [Send emails with Supabase Edge Functions - Resend](https://resend.com/docs/send-with-supabase-edge-functions)

## 3. Diseño técnico propuesto

### 3.1 Piezas nuevas

- **Twilio** (cuenta + número dedicado + Meta Business verificado): envío de plantillas WhatsApp (caso 1) y Verify API para OTP (caso 2, por WhatsApp o SMS a elección del usuario público).
- **Resend** (cuenta + dominio verificado): correo transaccional para OTP por correo (caso 2, alternativa a teléfono) y notificaciones al staff (caso 3).
- **Edge Functions nuevas** (mismo patrón que `supabase/functions/generate-combo-image`, la única referencia existente de "función que llama a una API externa"):
  - `send-portal-link`: arma y dispara la plantilla Utility de WhatsApp con el enlace `/portal/:token`. Invocada manualmente (botón nuevo junto a "Copiar enlace" en `customer.jsx` y en `OrderChecklistTab.jsx`) o automáticamente al regenerar el token.
  - `combo-public-start-verification` / `combo-public-confirm-verification`: envuelven Twilio Verify (`start` / `check`) para el flujo de `/pedir-combo`.
  - `send-staff-notification-email`: dispara un correo vía Resend para una notificación puntual del centro ya existente.
- **Tabla nueva `operations.message_log`** (auditoría/diagnóstico, no reemplaza a Twilio/Resend como fuente de verdad — solo registra qué se intentó mandar desde Oasis): `id`, `channel` (`'whatsapp'` \| `'email'`), `use_case` (`'portal_link'` \| `'staff_notification'`), `to_client_id` (nullable), `to_notification_id` (nullable), `status` (`'sent'` \| `'failed'`), `provider_id` (id de mensaje devuelto por Twilio/Resend, para poder buscarlo en su dashboard si hay un reclamo), `error`, `created_at`. Existe para poder responder "¿se le mandó el enlace a este cliente?" sin entrar al dashboard de Twilio.
- **Reutiliza sin cambios**: `clients.portal_token` (caso 1), `notifications.emailed_at` (caso 3, ya reservada), y el diseño de `combo_public_requests` del Bloque 3 salvo la parte de generación de código (ahora la resuelve Twilio Verify, no una columna `otp_code`/`otp_expires_at` propia).

### 3.2 Flujo por caso de uso

**Caso 1 — enlace del portal por WhatsApp**: staff hace clic en "Enviar por WhatsApp" (`customer.jsx` o `OrderChecklistTab.jsx`) → Edge Function `send-portal-link` llama a Twilio con la plantilla Utility aprobada y el número del cliente (`clients.phone`, ya existe) → se registra el intento en `message_log` → si fue exitoso, `OrderChecklistTab.jsx` puede marcar "enviado" automáticamente en `order_week_checklist.link_sent_at` (hoy ese marcado es manual, con esto se vuelve automático cuando el envío es por este botón).

**Caso 2 — portal público de combos**: visitante entra a `/pedir-combo`, arma su pedido, ingresa correo o teléfono → función `combo-public-start-verification` llama a Twilio Verify (`channel=sms|whatsapp`) o a Resend (si eligió correo) → visitante ingresa el código recibido → `combo-public-confirm-verification` valida contra Twilio Verify (o contra el hash de un OTP propio si el canal fue correo, ver nota) → si es válido, dentro de una única transacción se resuelve/crea el cliente (`source='combo_public'`) y se confirma el `combo_order`, igual que en el diseño original.
  - **Nota**: Twilio Verify no cubre "correo" como canal nativo en todos los planes/regiones de la misma forma que SMS/WhatsApp — si el usuario prioriza correo como canal principal, puede hacer falta mantener un OTP propio solo para ese canal (hash + expiración en `combo_public_requests`, como en el diseño original) y usar Twilio Verify solo para SMS/WhatsApp. Se resuelve al implementar, no bloquea seguir documentando.

**Caso 3 — notificación al staff por correo**: cuando `notify_pending_payments`/`notify_period_open`/`notify_period_close` (ya existentes, `20260817_notifications_center.sql`) insertan una fila en `notifications`, un job periódico (mismo mecanismo `pg_cron` ya usado, o un `pg_net`/webhook si se prefiere reaccionar al instante) detecta filas con `emailed_at IS NULL` y llama a `send-staff-notification-email` por cada una → Resend entrega el correo → se actualiza `emailed_at` y se registra en `message_log`.

## 4. RF/RNF

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-MSG-01 | El equipo debe poder disparar el envío del enlace del portal de pedidos por WhatsApp desde `customer.jsx` y desde el checklist semanal de envío, sin salir del panel. Extiende RF-PC-10. | Media | ⏳ Diseñado |
| RF-MSG-02 | El portal público de combos debe permitir identificarse por correo o por teléfono, y verificar esa identidad con un código de un solo uso antes de confirmar el pedido. Reemplaza/actualiza el diseño de generación de código del Bloque 3 de `07_REQUERIMIENTOS_COMBOS_VENTAS.md`. | Alta (bloquea Bloque 3) | ⏳ Diseñado |
| RF-MSG-03 | El staff debe poder recibir por correo las notificaciones que ya genera el centro de notificaciones interno (pago pendiente, apertura/cierre de semana) — sujeto a la decisión abierta en §6.5 sobre si aplica a las tres o solo a algunas. | Media | ⏳ Diseñado |
| RF-MSG-04 | Debe quedar un registro auditable (`message_log`) de cada intento de envío por WhatsApp o correo, con su resultado, para poder responder "¿se le mandó esto a este cliente/al staff?" sin depender del dashboard del proveedor externo. | Media | ⏳ Diseñado |

| ID | Requerimiento no funcional | Prioridad |
|---|---|---|
| RNF-MSG-01 | Los API keys de Twilio/Resend deben vivir en Supabase Secrets (variables de entorno de Edge Functions), nunca en el código del repo ni en el bundle del frontend. | Crítica |
| RNF-MSG-02 | Una falla en el envío de WhatsApp/correo no debe bloquear el flujo principal que lo origina (crear/regenerar el enlace del portal, confirmar un pedido de combo, generar una notificación interna) — el envío es una acción posterior, no un prerrequisito. | Alta |
| RNF-MSG-03 | El código de verificación del caso 2 debe expirar y tener un límite de intentos, para no quedar expuesto a fuerza bruta en un endpoint público sin autenticación previa. | Crítica |

## 5. Relación con los documentos existentes

- `03_REQUERIMIENTOS_PORTAL_CLIENTE.md` RF-PC-10 queda sin cambios en su descripción; este documento es su diseño técnico de implementación.
- `07_REQUERIMIENTOS_COMBOS_VENTAS.md §6, Bloque 3` queda vigente en sus decisiones de producto (qué pide, cuándo se crea el cliente, sin pago en línea); **la parte de generación/validación del código de verificación se actualiza** a favor de Twilio Verify en vez de un `email_outbox` propio, según §2 y §3 de este documento.

## 6. Decisiones que le tocan al usuario (bloquean implementar, no bloquean seguir documentando)

1. **¿Meta Cloud API directa o un BSP (Twilio recomendado)?** — recomiendo Twilio por simplicidad de integración para este volumen.
2. **Crear la cuenta de Meta Business Manager y completar la verificación de negocio** (documentos legales de Oasis) — proceso de días hábiles que solo el usuario puede iniciar (requiere datos legales de la empresa).
3. **Elegir el número de teléfono dedicado** para WhatsApp Business — no puede ser un número ya usado en WhatsApp normal o WhatsApp Business App.
4. **Crear la cuenta de Twilio y la de Resend**, generar los API keys correspondientes.
5. **Alcance de las notificaciones por correo al staff (RF-MSG-03)**: ¿las tres (pago pendiente, apertura y cierre de semana) o solo la de pago pendiente? El cierre de semana es explícitamente informativo (no bloquea nada) — puede no justificar un correo si ya existe la campanita.
6. **Canal principal del código de verificación del portal de combos**: ¿WhatsApp/SMS, correo, o dejar que el visitante elija? Afecta el copy del formulario de `/pedir-combo` y si hace falta mantener el OTP propio por correo mencionado en la nota de §3.2.

## 7. Costos estimados (orden de magnitud, no cotización — dependen del volumen real)

- Verificación de negocio en Meta: sin costo, solo tiempo (días hábiles).
- Twilio: número dedicado (~US$1-2/mes) + ~US$0.005/mensaje de markup sobre la tarifa de Meta (plantillas Utility, las del caso 1, son baratas — centavos de dólar según país) + Verify API (~US$0.05 por verificación exitosa, caso 2).
- Resend: gratuito hasta un límite de envíos mensuales, luego desde ~US$20/mes.
- Para el volumen esperado de Oasis (base de clientes chica, sin campaña masiva), el total combinado probablemente quede por debajo de los US$20-30/mes, pero es una estimación — no reemplaza cotizar directamente con cada proveedor antes de comprometerse.
