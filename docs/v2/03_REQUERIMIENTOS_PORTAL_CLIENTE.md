# v2 — Requerimientos: Portal de pedidos para clientes

> Módulo de mayor impacto y mayor superficie nueva (Fase 4 del roadmap, `00_ROADMAP.md §5.2, §6`). **Depende de la Fase 2** (rediseño de RLS/permisos) — no debe implementarse antes, porque es el primer punto del sistema donde alguien externo al equipo tiene cualquier tipo de acceso.

---

## 1. Contexto y objetivo

Hoy el cliente depende 100% del equipo para crear o modificar su pedido semanal. El objetivo es que el cliente pueda ver su plan y gestionar su pedido semanal él mismo, **sin pasarela de pago** (el cobro se sigue coordinando manualmente, como hoy) y sin necesidad de crear una cuenta con usuario/contraseña.

## 2. Mecanismo de acceso (decisión ya tomada)

**Enlace único por cliente**: cada `client` tiene un token propio, no adivinable, ligado a `id_client`. El cliente entra a `/portal/:token` sin login. Razonamiento completo en `00_ROADMAP.md §5.2`.

### Patrón técnico requerido (no es opcional, es la parte que da seguridad real)

Un token por cliente **no es suficiente por sí solo** si el acceso a los datos se resuelve con RLS que confía en un filtro que arma el propio cliente (ej. `select * from clients where portal_token = X` no es seguro si la política RLS solo repite esa misma condición, porque no impide una consulta sin filtro o con otro filtro). El patrón correcto:

- Una función de Postgres (`SECURITY DEFINER`, ej. `get_portal_client(p_token uuid)`) que valida el token **del lado del servidor** y devuelve únicamente los datos de ese cliente.
- El rol anónimo (`anon`) tiene permiso de ejecutar esa función y funciones equivalentes para leer/escribir pedidos — **no tiene permiso de `SELECT`/`INSERT` directo sobre las tablas de negocio** (`clients`, `orders`, `order_day_details`, etc.).
- Esto es justamente el trabajo de la Fase 2 del roadmap: hoy esas tablas tienen RLS abierta para cualquier usuario autenticado, lo cual es aceptable solo mientras todos los usuarios son internos.

## 3. Qué puede hacer el cliente en el portal

| Función | Detalle |
|---|---|
| Ver su plan | Nombre, tipo de cliente (`personal`/`family`), plan (`estandar`/`nutricional`), macros de almuerzo/cena, ruta y día(s) de entrega asignados. Solo lectura — el cliente no edita sus propios macros ni su ruta. |
| Ver/seleccionar su menú semanal | Reutiliza las reglas ya existentes de plantillas y macros (`orderUtils.js`) — **no se duplica la lógica**, se llama desde el portal igual que la usa `AddOrder.jsx` internamente. |
| Confirmar pedido | Cae en las mismas tablas (`orders`, `order_day_details`) con estado `PENDING`, igual que un pedido creado por el equipo — el staff lo ve idéntico en Órdenes/Entregas, sin pantalla nueva para "pedidos del portal". |
| Editar pedido ya enviado | Solo mientras siga en `PENDING` y antes del corte que se defina (§6, pregunta abierta) — una vez que cocina empieza a procesarlo, ya no debería ser editable desde el portal. |

### Reglas de negocio existentes que el portal debe respetar, no reinventar

- **Resolución de semana**: si el cliente edita lunes/martes, aplica a la semana actual; cualquier otro día, a la semana siguiente (regla ya definida en `orderUtils.js`).
- **Clientes `family`**: sin selección de macros, plantilla semanal fija, entrega solo viernes, `classification='Family'` — el portal no debe ofrecerles opciones que no tienen hoy en el flujo interno.
- **Clientes Express**: fuera de alcance de la primera versión del portal (ver §6).

## 4. Explícitamente fuera de alcance (salvo que se pida lo contrario)

- Pago en línea o pasarela de pago — el pedido queda pendiente de pago igual que hoy, lo cobra el equipo.
- Historial de pagos del cliente.
- Edición de datos de contacto/dirección del cliente.
- Soporte/chat dentro del portal.
- Pedidos Express o Combos — **confirmado (2026-08-11)**: la v1 del portal cubre solo pedidos regulares (personal/family). Express y Combos quedan para una segunda etapa, evaluada después de validar el portal con lo básico.

## 5. RF/RNF

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-PC-01 | Cada cliente debe tener un enlace propio no adivinable para acceder a su portal, sin usuario/contraseña. | Alta |
| RF-PC-02 | El portal debe mostrar el plan actual del cliente (macros, tipo, ruta, día de entrega) en modo solo lectura. | Alta |
| RF-PC-03 | El cliente debe poder seleccionar/confirmar su pedido semanal respetando las mismas reglas de plantillas y macros que usa hoy el flujo interno. | Alta |
| RF-PC-04 | El pedido confirmado desde el portal debe crear/actualizar registros en `orders`/`order_day_details` en estado `PENDING`, indistinguibles en las pantallas internas de un pedido creado por el equipo (salvo un campo de origen, ver RF-PC-07). | Alta |
| RF-PC-05 | El cliente debe poder editar su pedido solo mientras esté en `PENDING`, hasta la noche anterior (23:59) al día de producción de cada plato. Pasado ese corte, el portal debe mostrar ese día como no editable — el resto de días del pedido que aún no llegaron a su corte siguen editables. | Alta |
| RF-PC-06 | El equipo debe poder regenerar el enlace de un cliente (invalidando el anterior) desde el detalle de cliente, para el caso de un enlace comprometido o extraviado. | Media |
| RF-PC-07 | Los pedidos creados desde el portal deben quedar identificables (ej. columna `created_via` u origen) para poder medir adopción en dashboards (`00_ROADMAP.md §5.3`). | Media |
| RF-PC-08 | El portal no debe ofrecer ninguna función de pago en línea. | Alta (restricción, no feature) |
| RF-PC-09 | El equipo debe poder copiar/compartir manualmente el enlace del portal desde el detalle del cliente (ej. botón "Copiar enlace"). | Alta |
| RF-PC-10 | El sistema debe poder enviar el enlace del portal de forma automatizada (SMS o WhatsApp) al dar de alta al cliente o al regenerar su enlace — requiere elegir un proveedor de mensajería (ver §6). | Media |
| RF-PC-11 | Al confirmar el pedido, el portal debe mostrarle al cliente un resumen simple de lo que pidió (recetas/días seleccionados) como comprobante en pantalla. | Alta |
| RF-PC-12 | El detalle de cliente en el panel interno ya muestra el historial de pedidos (`OrdersSection`/`HistoryView`, existente en v1) — los pedidos creados desde el portal caen en las mismas tablas, así que aparecen ahí automáticamente sin trabajo adicional. Se valida en pruebas, no se reconstruye. | — (ya cubierto por v1) |

| ID | Requerimiento no funcional | Prioridad |
|---|---|---|
| RNF-PC-01 | El acceso a datos desde el portal debe resolverse mediante funciones `SECURITY DEFINER` que validan el token del lado del servidor — no mediante RLS que confíe en un filtro provisto por el cliente. | Crítica |
| RNF-PC-02 | El rol anónimo no debe tener `SELECT`/`INSERT`/`UPDATE` directo sobre tablas de negocio (`clients`, `orders`, `order_day_details`, etc.) — solo `EXECUTE` sobre las funciones del portal. | Crítica |
| RNF-PC-03 | El token debe ser generado con suficiente entropía (UUID v4 o equivalente), no derivable de `id_client` ni de ningún otro dato público. | Alta |
| RNF-PC-04 | El portal debe ser usable desde celular (es el dispositivo principal esperado, dado que el enlace se comparte por WhatsApp). | Alta |
| RNF-PC-05 | Este módulo no debe implementarse antes de completar la Fase 2 (rediseño de RLS/permisos) del roadmap. | Crítica (secuencia, no técnica) |

## 6. Decisiones (resueltas 2026-08-11)

1. **Corte de edición**: hasta la noche anterior (23:59) al día de producción de cada plato. Ver RF-PC-05.
2. **Alcance de la v1 del portal**: solo pedidos regulares (personal/family). Express y Combos quedan para una segunda etapa. Ver §4.
3. **Distribución del enlace**: **las dos maneras** — manual (el equipo copia/comparte el enlace desde el detalle de cliente, RF-PC-09) **y** automatizada (envío por SMS o WhatsApp al dar de alta o regenerar el enlace, RF-PC-10). La vía automatizada agrega una dependencia nueva: **elegir un proveedor de mensajería** (ej. WhatsApp Business API, Twilio u otro) — implica costo/contrato propio y queda como pendiente técnico antes de poder implementar RF-PC-10. Sugiero que el envío manual esté disponible desde el primer entregable del portal, y el automatizado se sume como mejora inmediatamente después, sin que uno bloquee al otro.
4. **Confirmación al cliente**: resumen simple de lo pedido en pantalla al confirmar (RF-PC-11), no solo un mensaje genérico.
5. **Historial para el administrador**: ya existe en v1 — el detalle de cliente (`customer.jsx` → `OrdersSection` → `HistoryView`) ya muestra el historial de pedidos de cada cliente. Como los pedidos del portal caen en las mismas tablas (`orders`/`order_day_details`), van a aparecer ahí automáticamente sin construir nada nuevo (RF-PC-12) — solo hay que validarlo en pruebas cuando el portal esté implementado.

### Pendiente técnico que queda abierto
- **Proveedor de mensajería** para el envío automatizado del enlace (RF-PC-10): a definir (WhatsApp Business API, Twilio, u otro) según costo y lo que ya tengan disponible. No bloquea seguir documentando otros módulos, pero sí bloquea implementar esa parte puntual.

## 7. Estado de implementación (2026-08-12)

**Implementado y probado de punta a punta** (backend real, cliente de prueba desechable vía Playwright, personal y familiar): RF-PC-01 a RF-PC-05, RF-PC-07, RF-PC-08, RF-PC-09, RF-PC-11, RF-PC-12, RNF-PC-01 a RNF-PC-04. Ver `docs/v2/08_DISEÑO_RLS.md` para el detalle técnico de las 4 funciones `SECURITY DEFINER` (`portal_get_client`, `portal_get_current_order`, `portal_get_menu_options`, `portal_submit_order`) y `supabase/migrations/20260813_customer_portal.sql`.

**Simplificaciones deliberadas de esta v1** (documentadas en el propio encabezado de la migración, no son bugs): no se reproducen los overrides avanzados que hoy solo usa el staff — macro por día distinto al base, override de composición de ingredientes por receta, ni el toggle Almuerzo/Cena por receta "extra" en pedidos `both`. El cliente ve sus macros pero no los edita (por diseño, RF-PC-02). Tampoco se ofrece el selector de "plantilla" que usa el asistente interno — el cliente arma su semana receta por receta, igual que ya hace el staff con clientes `family` hoy.

**Actualización 2026-08-12**: RF-PC-06 (regenerar enlace) y RF-PC-09 (copiar enlace) ya se probaron en vivo con una cuenta de staff real (ver `[[reference-staff-test-account]]`) — ambos botones funcionan correctamente contra `customer.jsx`. Ya no quedan pendientes de prueba.

**Pendiente final del proyecto (a propósito, no bloquea nada más)**: RF-PC-10 (envío automatizado del enlace por SMS/WhatsApp) sigue sin proveedor de mensajería elegido. El usuario decidió dejarlo, junto con la integración de correo del portal público de combos (`07_REQUERIMIENTOS_COMBOS_VENTAS.md §6, Bloque 3`), como el **último pendiente a resolver del roadmap de v2** — ambos dependen de que el usuario elija/contrate un proveedor externo (mensajería y/o correo transaccional), así que tiene sentido resolverlos juntos al final en vez de bloquear el resto del trabajo.

**Actualización 2026-08-19**: diseño técnico de RF-PC-10 (proveedor recomendado, arquitectura, RF/RNF de implementación) documentado en `09_REQUERIMIENTOS_MENSAJERIA.md` — sigue bloqueado por la misma dependencia externa (elegir/contratar Twilio + verificación de negocio en Meta), no cambia el estado de "pendiente".
