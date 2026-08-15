# v2 — Diseño técnico: Etapa 2 del plan de implementación (acceso del portal, sin tocar RLS de staff)

> Prerrequisito de `03_REQUERIMIENTOS_PORTAL_CLIENTE.md` (Fase 4/Etapa 3), según `06_PLAN_IMPLEMENTACION.md`. Este documento es **solo diseño** — no se implementó ninguna función ni migración todavía, eso es trabajo de la Etapa 3 (build del portal).

## 1. Contexto

Se auditó el modelo de roles y RLS actual (`supabase/migrations/20260704_rls_policies.sql` + las migraciones posteriores que abren tablas nuevas a `authenticated`) antes de proponer cualquier cambio. Conclusión de la auditoría: **el RLS de staff ya está bien** para lo que hace hoy — todas las tablas de negocio abiertas a cualquier `authenticated` porque no hay separación real staff-vs-staff (confirmado, es el comportamiento actual deseado, documentado en el propio comentario de cabecera de `20260704_rls_policies.sql`), y las tablas realmente sensibles (`expenses`, `empCost`, etc.) ya están restringidas a `Administrador`/`Finanzas`. El rol `"Clientes"` es, en la práctica, un rol de **staff interno** que gestiona la cartera de clientes (`customers.jsx`, `customer.jsx`, `Prospects.jsx`) — no tiene ninguna relación con clientes reales, no hay columna que vincule un usuario de `auth.users` a un `id_client`.

Por eso este documento **no propone cambios al RLS de staff**. Lo que sí falta, y es lo que realmente bloquea la Etapa 3 (portal), es el mecanismo de acceso para alguien **externo al equipo** (un cliente real, sin cuenta de Supabase Auth) — que ya está decidido conceptualmente en `03_REQUERIMIENTOS_PORTAL_CLIENTE.md §2` (RNF-PC-01/02): funciones `SECURITY DEFINER` que validan el token del lado del servidor, con el rol `anon` limitado a `EXECUTE` sobre esas funciones, sin `SELECT`/`INSERT` directo sobre tablas de negocio. Este documento especifica exactamente qué funciones, qué columnas nuevas, y qué grants hacen falta para que la Etapa 3 pueda construirse sobre esto sin tener que rediseñar el acceso a mitad de camino.

## 2. Cambios de esquema necesarios

```sql
-- Vínculo cliente ↔ portal, sin login. Un solo token vigente por cliente —
-- regenerarlo (RF-PC-06) invalida el anterior automáticamente al sobrescribirlo.
ALTER TABLE operations.clients
  ADD COLUMN IF NOT EXISTS portal_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS portal_token_regenerated_at timestamptz;

-- Origen del pedido, para el desglose de adopción del portal (RF-PC-07,
-- RF-DASH-03 de 04_REQUERIMIENTOS_DASHBOARDS.md).
ALTER TABLE operations.orders
  ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'staff'; -- 'staff' | 'portal'
```

`portal_token` no lleva RLS de lectura para `anon` — no se consulta por SELECT directo nunca, solo se pasa como parámetro a las funciones de abajo, que lo validan del lado del servidor (RNF-PC-01). El staff sigue pudiendo actualizarlo (regenerar enlace, RF-PC-06) con una simple `UPDATE ... SET portal_token = gen_random_uuid()`, porque `clients` ya tiene policy abierta a `authenticated` — no hace falta una función nueva para eso, es una acción de staff, no de `anon`.

## 3. Funciones `SECURITY DEFINER` necesarias

Todas con `SET search_path = operations, pg_temp` (mismo patrón que `operations.user_has_role` en `20260704_rls_policies.sql`) y `GRANT EXECUTE ... TO anon` — ninguna otra concesión a `anon` sobre las tablas subyacentes.

| Función | Qué hace | Nota de seguridad |
|---|---|---|
| `portal_get_client(p_token uuid)` | Devuelve datos de solo lectura del cliente (RF-PC-02): nombre, `client_type`, plan, macros de almuerzo/cena, ruta y días de entrega. `NULL`/vacío si el token no matchea ninguna fila. | Nunca debe devolver más de un cliente ni exponer `id_client` real si no hace falta en el frontend (usar el token como identificador en el resto de llamadas, no el id). |
| `portal_get_current_order(p_token uuid)` | Devuelve el pedido de la semana vigente del cliente (`orders`/`order_days`/`order_day_details`) con un flag `is_editable` calculado **en el servidor** por día, según el corte de RF-PC-05 (23:59 la noche anterior a `delivery_date`). | El flag `is_editable` NO debe confiar en que el frontend lo respete — `portal_submit_order` vuelve a validar el corte por su cuenta (ver abajo), este flag es solo para pintar la UI. |
| `portal_get_menu_options(p_token uuid)` | Devuelve las recetas/plantillas disponibles para armar el pedido, reutilizando las reglas ya existentes de `orderUtils.js` (RF-PC-03) — **no se reimplementa la lógica de macros/plantillas**, la función solo expone lo mínimo que el portal necesita para ofrecer las mismas opciones que ya usa `AddOrder.jsx` internamente. | Sin datos de otros clientes — es catálogo general (recetas activas, plantillas), no depende del cliente salvo para filtrar por `client_type`. |
| `portal_submit_order(p_token uuid, p_payload jsonb)` | Crea o actualiza `orders`/`order_days`/`order_day_details` en `PENDING`, con `created_via='portal'` en el insert (RF-PC-04, RF-PC-07). Antes de escribir CUALQUIER día, revalida el corte de RF-PC-05 para ese `order_day` puntual — si ya pasó, ese día se ignora silenciosamente (no rompe el resto del payload) y se informa en la respuesta qué días no se aplicaron. | Es la función más sensible — valida token, valida pertenencia de cada `order_day`/`order_day_detail` al cliente del token (nunca confiar en IDs que vengan del payload sin cruzarlos contra el cliente resuelto por el token), y valida el corte por día server-side, no solo al leer. |

Las primeras tres son de solo lectura (`STABLE`); la última es la única que escribe. Ninguna reemplaza lógica ya existente del lado interno (`orderUtils.js`, `useMacros.js`, `useDayRecipes.js`) — la reutilizan tal cual, según ya estaba decidido en RF-PC-03 ("no se duplica la lógica").

## 4. Grants

```sql
REVOKE ALL ON operations.clients, operations.orders, operations.order_days,
  operations.order_day_details, operations.order_templates,
  operations.order_template_days, operations.order_template_details,
  operations.recipes, operations.routes, operations.route_delivery_days
  FROM anon;
-- (recipes ya tenía SELECT anónimo para /menu del sitio público — se mantiene
-- esa policy puntual, ver abajo; el resto de esta lista nunca debe ser
-- accesible directo por anon una vez exista el portal)

GRANT EXECUTE ON FUNCTION operations.portal_get_client(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION operations.portal_get_current_order(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION operations.portal_get_menu_options(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION operations.portal_submit_order(uuid, jsonb) TO anon, authenticated;
```

Nota: el `REVOKE` de arriba es conceptual — hoy `anon` ya no tiene acceso directo a estas tablas salvo `recipes` (política `recipes_anon_select`, necesaria para `/menu` del sitio público, **no se toca**) y las agregadas en la Fase 3 (`leads` insert-only, `promotions`/`combo_weeks`/`bulk_dishes` select). El `REVOKE` explícito es solo para dejarlo a prueba de que alguna migración futura abra una de estas tablas a `anon` por error sin pasar por este documento.

**Corrección 2026-08-12 (implementación real, `20260813_customer_portal_authenticated_grant.sql`)**: el diseño original solo otorgaba `EXECUTE` a `anon`. En la práctica, el cliente `supabase-js` adjunta automáticamente el JWT de sesión a cualquier request cuando hay una sesión activa — así que el staff, probando el portal desde el mismo navegador donde tiene sesión iniciada, hace la llamada como `authenticated`, no `anon`, y quedaba rechazado con 403. Se agregó `TO authenticated` también en las 4 funciones. No cambia el modelo de seguridad: la función sigue resolviendo únicamente por token (nunca por sesión), nunca expone más de un cliente por llamada, y el staff ya tiene acceso completo a los datos de cualquier cliente por las tablas directamente — dejarlo ejecutar estas funciones no es una superficie nueva.

## 5. Qué NO cambia

- El RLS de staff (`FOR ALL TO authenticated USING (true)` en las tablas de `open_tables`) sigue igual — confirmado en la auditoría que es el comportamiento correcto actual, no hay pedido de separar staff-vs-staff.
- Las tablas restringidas a `Administrador`/`Finanzas` (`expenses`, `empCost`, etc.) siguen igual.
- El rol `"Clientes"` de `operations."Roles"` sigue siendo lo que es hoy (rol de staff que gestiona clientes) — este documento no lo renombra ni le cambia semántica, quedó fuera de alcance (el usuario lo descartó explícitamente al elegir el alcance de este documento).

## 6. Otro hallazgo de la auditoría (fuera de alcance de este documento)

`operations.leads` (nueva, Fase 3) quedó con SELECT/UPDATE abierto a **cualquier** `authenticated`, no solo a quienes gestionan clientes (`Administrador`/`Clientes`) — es dato de terceros (ni siquiera clientes todavía: nombre/teléfono/email/mensaje de gente que llenó el formulario público). No se corrige acá porque el usuario eligió explícitamente el alcance "documento de diseño del portal" sobre "el hallazgo concreto de hoy" al decidir esta etapa — queda anotado para resolverlo cuando se retome.

## 7. Próximos pasos (Etapa 3 — implementación del portal)

1. Migración con los cambios de esquema de §2 y las funciones de §3 (código SQL real, no solo firmas).
2. Frontend del portal (`/portal/:token`, fuera de `MainLayout`/`PublicLayout` — layout propio, sin navbar interna ni sitio de marketing).
3. Botón "Copiar enlace" / "Regenerar enlace" en `customer.jsx` (RF-PC-06, RF-PC-09) — no necesita las funciones nuevas, ya es una operación de staff sobre `clients` con RLS abierta.
4. Envío automatizado del enlace (RF-PC-10) sigue bloqueado por la elección de proveedor de mensajería (pendiente sin resolver, ver `03_REQUERIMIENTOS_PORTAL_CLIENTE.md §6`).
