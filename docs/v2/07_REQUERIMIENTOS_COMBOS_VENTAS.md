# v2 — Requerimientos: Combos, Ventas Masivas y mejoras transversales

> Registro retroactivo de lo implementado en una sesión de trabajo puntual, fuera del orden original de fases del roadmap (`00_ROADMAP.md`) — surgió como pedido directo del usuario mientras se cerraba la Fase 3 (sitio público, `02_REQUERIMIENTOS_SITIO_PUBLICO.md`) y la Fase 5 iterativa de dashboards (`04_REQUERIMIENTOS_DASHBOARDS.md`). No reemplaza esos documentos, los extiende.

## 1. Contexto

Durante la implementación de promociones del sitio público (RF-PUB-02), el usuario pidió que una promoción pudiera basarse en un **Combo semanal** o un **plato de Venta Masiva** ya registrados, en vez de cargar título/precio 100% manuales. Esto llevó a tres pedidos adicionales relacionados con los módulos de Combos y Ventas Masivas que no estaban cubiertos por ningún documento de requerimientos existente:

1. Vínculo de promociones a Combo/Venta Masiva, con precio en vivo.
2. Histórico de **configuración** de combos por semana (categorías/ítems/precio base) — distinto del histórico de **pedidos** que ya existía (`ComboHistoryView.jsx`).
3. Panel de dashboard con métricas propias de Combos y Ventas Masivas (hoy solo aparecían mezcladas dentro del pie genérico de "Ingresos por tipo").

De paso, se resolvió un pedido transversal sin relación directa con Combos/Ventas: tooltips confiables en los botones de ícono de todas las tablas del panel interno (el `title=` nativo del navegador no se veía para el usuario).

## 2. Vínculo de promociones a Combo/Venta Masiva

| ID | Requerimiento | Estado |
|---|---|---|
| RF-CV-01 | El formulario de alta/edición de promociones (`PromotionFormModal.jsx`) debe permitir elegir un origen: Manual, Combo semanal o Venta masiva. | ✅ Implementado |
| RF-CV-02 | Al elegir un Combo semanal o un plato de Venta Masiva existente, el título y el precio de la promoción se autocompletan (editables después). | ✅ Implementado |
| RF-CV-03 | Mientras la promoción esté vinculada, el precio mostrado en `/promociones` (público) y en el panel admin debe ser el precio **en vivo** del combo/plato de origen (join), no una copia fija — si cambia el precio original, la promoción lo refleja sin editarla a mano. | ✅ Implementado |
| RF-CV-04 | Si se borra el combo/plato vinculado, la promoción no debe romperse: cae al precio de respaldo guardado (`price_label`). | ✅ Implementado (`ON DELETE SET NULL`) |

**Esquema**: `operations.promotions` ganó `source_type` (`'manual'` \| `'combo'` \| `'bulk_dish'`), `combo_week_id`, `bulk_dish_id` — migración `supabase/migrations/20260812_promotions_source_link.sql`. Incluye políticas RLS nuevas de lectura anónima en `combo_weeks` y `bulk_dishes` (antes solo `authenticated`), necesarias para que la página pública pueda mostrar el precio en vivo.

## 3. Histórico de configuración de combos

| ID | Requerimiento | Estado |
|---|---|---|
| RF-CV-05 | Debe existir una vista de solo lectura de las semanas de combo pasadas, mostrando qué categorías/ítems estuvieron habilitados y el precio base de cada una — no los pedidos de clientes (eso ya lo cubre la pestaña "Histórico" existente). | ✅ Implementado |

Nueva pestaña "Semanas anteriores" en `/combos` (`ComboWeekConfigHistory.jsx`), paginada, reutilizando el mismo select anidado que ya usaba `ComboOrdersTab.jsx` para la semana activa.

## 4. Dashboard de Combos y Ventas Masivas

| ID | Requerimiento | Estado |
|---|---|---|
| RF-CV-06 | Debe existir una pestaña de estadísticas dedicada a Combos y Ventas Masivas, con métricas propias (no solo el monto mezclado dentro de "Ingresos por tipo"). | ✅ Implementado |
| RF-CV-07 | Combos: vendido en el período, cantidad de pedidos, precio promedio, ingresos por semana, ítems más elegidos. | ✅ Implementado |
| RF-CV-08 | Ventas Masivas: vendido en el período, cantidad de lotes cocinados, % de aprovechamiento (vendido/cocinado), ingresos por plato. | ✅ Implementado |

Nueva pestaña "Combos y Ventas Masivas" en `/estadisticas` (`ComboBulkPanel.jsx`), siguiendo el mismo patrón visual que `GastosPanel.jsx`/`IngresosPanel.jsx` (StatCard + ChartCard + `recharts`, sin librería nueva — mismo criterio que RF-DASH-04 de `04_REQUERIMIENTOS_DASHBOARDS.md`).

## 5. Tooltips confiables (transversal, no específico de Combos/Ventas)

| ID | Requerimiento | Estado |
|---|---|---|
| RNF-CV-01 | Todo botón de solo-ícono en una tabla del panel interno debe mostrar una etiqueta explicativa al pasar el mouse, de forma confiable (no depender del `title=` nativo del navegador). | ✅ Implementado |

Componente nuevo `src/components/Tooltip.jsx` (CSS puro, `group`/`group-hover` de Tailwind — patrón ya usado en otras partes del repo, ver `Orders.jsx`/`BulkDishes.jsx`). Reemplazó `title=` en los 20 botones de ícono existentes en `PaymentTable.jsx`, `Prospects.jsx`, `PromotionsAdmin.jsx` y `ExpenseTable.jsx` — era el inventario completo de tablas del panel interno con ese patrón.

## 6. Portal de combos y flujo de envío de links (continuación del Portal de Cliente)

> Pedido del usuario tras cerrar el Portal de Cliente (`03_REQUERIMIENTOS_PORTAL_CLIENTE.md`, que dejó explícitamente fuera Combos/Express): *"Hay que resolver también el link para poder pedir los combos... además hay que resolver cómo se van a enviar al cliente los links... no todos los clientes activos llevan todas las semanas."* Se dividió en 3 bloques independientes.

### Bloque 1 — Precio por ítem + historial, eliminar fecha de entrega (✅ Implementado)

| ID | Requerimiento | Estado |
|---|---|---|
| RF-CV-09 | Cada ítem del catálogo de combos (`combo_items`) debe tener un precio propio, con historial de cambios auditable. | ✅ Implementado |
| RF-CV-10 | Cuando un cliente se pasa del cupo agrupado de una categoría, la unidad extra se cobra automáticamente al precio del ítem — ya no se le pide al staff que escriba un monto a mano. | ✅ Implementado |
| RF-CV-11 | La fecha de entrega deja de existir como concepto en todo el sistema de combos (staff y portal) — los combos se organizan solo por `combo_week`. | ✅ Implementado |

**Esquema**: `combo_items.price` (nuevo), tabla `combo_item_price_history` (insert-only vía trigger `SECURITY DEFINER`, `authenticated` solo puede leer), `combo_order_selections.unit_price` (snapshot al momento del pedido), `combo_orders.delivery_date` pasó a nullable (no se elimina la columna todavía — limpieza futura). Migración `supabase/migrations/20260814_combo_item_pricing.sql`.

**Frontend**: `ComboExtraChargeModal.jsx` eliminado (ya no aplica). `ComboItems.jsx`/`AddComboItem.jsx` ganaron el campo de precio + un visor de historial. `AddComboOrder.jsx`/`EditComboOrder.jsx` perdieron el paso/campo de fecha de entrega y el flujo de "monto extra" manual. `ComboWeekBuilder.jsx` perdió el input de "Costo extra" por ítem (el precio ahora es del catálogo, no de la configuración semanal). `DeliveriesCombos.jsx` pasó de filtrar por rango de fechas calendario a navegar por `combo_week` directamente (pierde granularidad de "qué se entrega tal día puntual" — consecuencia directa de RF-CV-11, confirmada con el usuario).

### Bloque 2 — Checklist semanal de envío (pedidos regulares) (✅ Implementado)

| ID | Requerimiento | Estado |
|---|---|---|
| RF-CV-12 | Debe existir una lista persistida por semana donde el staff marca qué clientes activos deben recibir el link del portal de pedidos regulares esta semana. | ✅ Implementado |

**Esquema**: tabla `operations.order_week_checklist` (`week_start_date`, `client_id`, `should_send`, `link_sent_at`, `UNIQUE(week_start_date, client_id)`). Migración `supabase/migrations/20260814_order_week_checklist.sql`. Sin filas pre-sembradas: si la semana actual no tiene fila para un cliente, la UI usa como valor por defecto lo que quedó marcado la semana anterior (o `true` si no hay antecedente) y solo escribe en la tabla cuando el staff togglea o marca "enviado" — evita un insert masivo semanal innecesario.

**Frontend**: nueva pestaña "Checklist envío" en `/Pedidos` (`OrderChecklistTab.jsx`), reutilizando la navegación de semana ya existente (`getWeekBounds`/`WEEK_OPTIONS` de `Orders.jsx`). Por cliente: toggle "pide esta semana", botón "Marcar enviado", botón "Copiar enlace" (mismo patrón que la tarjeta "Portal de cliente" de `customer.jsx`).

### Bloque 3 — Portal público de combos con verificación OTP (⏳ Diseñado, no implementado)

A diferencia del portal regular (token por cliente), este es un **link público único sin token** (`/pedir-combo`), pensado para publicarse en redes sociales y abierto a cualquier persona, no solo clientes existentes. Decisiones cerradas con el usuario:

- Pide correo y teléfono; casilla de consentimiento de datos prevista (mecanismo listo, texto legal real pendiente de que el usuario lo redacte con su asesor).
- Anti-fraude: verificación por código (OTP) de 6 dígitos al correo antes de confirmar el pedido.
- El cliente público se resuelve/crea automáticamente en `clients` (`source='combo_public'`) recién después de verificar el código, dentro de una única transacción junto con el `combo_order`.
- Sin pago en línea: el `payment_id` del pedido público queda `NULL`, el staff concilia el cobro manualmente (mismo criterio que hoy).

**Bloqueante externo**: requiere que el usuario cree una cuenta en un proveedor de correo transaccional (Resend recomendado) y genere un API key antes de poder implementarse — no hay ninguna integración de correo/SMS existente en el repo para reutilizar. Diseño completo (esquema `combo_public_requests`/`email_outbox`, funciones `SECURITY DEFINER`, Edge Function `send-combo-otp`) documentado en el plan de implementación de esta ronda; pendiente de retomar cuando el usuario tenga la cuenta lista.

**Actualización 2026-08-19**: la parte de generación/validación del código OTP de este diseño se actualiza en `09_REQUERIMIENTOS_MENSAJERIA.md` — en vez de `email_outbox` armado a mano, se recomienda Twilio Verify (WhatsApp/SMS/correo, expiración y límite de intentos ya resueltos por el proveedor), ya que de todas formas hace falta integrar Twilio para RF-PC-10. El resto del diseño de este Bloque 3 (qué pide, cuándo se crea el cliente, sin pago en línea) no cambia. Sigue bloqueado por la misma dependencia externa.

## 7. Pendientes / dependencias

- Ninguno de los ítems de este documento bloquea otro módulo del roadmap.
- La migración `20260812_promotions_source_link.sql` ya fue aplicada por el usuario.
- El próximo documento de diseño técnico previsto en el roadmap (rediseño de RLS/permisos, Etapa 2 de `06_PLAN_IMPLEMENTACION.md`) se numerará `08_DISEÑO_RLS.md` para no chocar con este archivo.
- **Bloque 3 (portal público de combos) y RF-PC-10 (envío automatizado del enlace del portal regular, `03_REQUERIMIENTOS_PORTAL_CLIENTE.md`) quedan como el pendiente final de todo el roadmap de v2** — el usuario decidió dejarlos para el cierre del proyecto en vez de bloquear el resto, ya que ambos dependen de que elija/contrate un proveedor externo (correo transaccional y/o mensajería SMS/WhatsApp).
