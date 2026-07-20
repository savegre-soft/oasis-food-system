# Mapa del Sistema — Oasis Food System

> Documento de referencia técnica generado a partir de una revisión completa del código (2026-07-19).
> Objetivo: que cualquier persona (o Claude, en próximas conversaciones) pueda entender la arquitectura, el modelo de datos y las reglas de negocio del sistema **sin tener que releer todo el proyecto**.
> Si el código cambia de forma significativa, este documento debe actualizarse.
>
> **Actualización 2026-07-19 (mismo día):** se aplicaron correcciones y limpieza sobre casi todos los hallazgos de las secciones §8/§9, EXCEPTO los 3 puntos marcados 🔴 en las recomendaciones (formulario público sin `onSubmit`, bug de "devolver a empaque" en Express, RLS abierto en tablas de negocio) que se dejaron sin tocar a petición explícita. Ver «Cambios aplicados» al final del documento para el detalle.

---

## 1. Resumen general

**Oasis Food System** es una aplicación web de gestión integral para un negocio de alimentación por suscripción (meal-prep / entrega de comidas semanales). Administra clientes, pedidos semanales con recetas y macros, producción de cocina, rutas de entrega, pagos, gastos y planilla de empleados.

- **Frontend:** React 19 (RC) + Vite 7 + React Router 7 + TailwindCSS 4 + Framer Motion + Recharts (gráficos) + Leaflet/react-leaflet (mapas).
- **Backend:** Supabase (Postgres + Auth + Storage), sin backend propio. Todo el acceso a datos se hace desde el cliente vía `@supabase/supabase-js`.
- **Sin TypeScript.** JS/JSX puro, con JSDoc parcial en los hooks más nuevos.
- **Validación de esquemas:** se introdujo `zod` el 2026-07-19 como piloto, usado hasta ahora solo en `AddCustomer.jsx`. El resto de formularios sigue con validación manual ad hoc por campo.
- **Sin backend propio / sin API intermedia**: la seguridad depende de RLS (Row Level Security) en Postgres + un gate de roles en el cliente.

### Arquitectura

```
React Components
      │
React Context (AppContext) ── solo Auth + Theme, NO estado de dominio
      │
Hooks por feature (useCustomers, useDashboardData, usePaymentStatistics, ...)
      │
Supabase Client (src/lib/supabase.js)
      │
Supabase (Postgres schema "operations" + "public", Auth, Storage)
```

Importante: `AppContext` **no** centraliza el estado de negocio (clientes, pedidos, pagos, etc.). Cada página/hook hace sus propias queries a Supabase. Esto significa que no hay una fuente única de verdad en memoria — hay que revisar cada hook/página para saber cómo se obtienen los datos.

---

## 2. Mapa de rutas (`src/App.jsx`)

### A. Rutas protegidas (`MainLayout`, requieren sesión de Supabase Auth)

`MainLayout` solo verifica que exista un `user` en sesión (no verifica roles). Si no hay sesión, redirige a `/login`.

| Ruta | Página | Notas |
|---|---|---|
| `/main` | `Main.jsx` | Dashboard operativo |
| `/Clientes` | `customers.jsx` | Listado de clientes — gate `AuthRoles: Administrador, Clientes` |
| `/cliente/:id` | `customer.jsx` | Detalle de cliente — mismo gate |
| `/orders` | `Orders.jsx` | Gestión de pedidos semanales/express (Semana/Histórico) — sin combos, ver más abajo |
| `/combos` | `Combos.jsx` | Gestión de pedidos de combo (Semana/Histórico) — pantalla propia desde 2026-07-20 |
| `/entregas` | `Deliveries.jsx` | Producción semanal: Cocina → Empaque → Entrega |
| `/entregas/express` | `DeliveriesExpress.jsx` | Producción de pedidos Express (entrega hoy) — pantalla propia desde 2026-07-20 |
| `/entregas/combos` | `DeliveriesCombos.jsx` | Producción de pedidos de combo (con selector de semana + vista Por cliente/Por plato) — pantalla propia desde 2026-07-20 |
| `/menus` | `Menus.jsx` | CRUD de recetas/platillos (a pesar del nombre "menus") |
| `/templates` | `Templates.jsx` | Plantillas semanales de menú |
| `/routes` | `Routes.jsx` | Rutas de entrega |
| `/combo-items` | `ComboItems.jsx` | Catálogo de ítems de combo (Arroz/Proteína/Acompañamientos/Extras/Plato Extra) |
| `/pagos` | `Payments.jsx` | Pagos — gate `Finanzas, Administrador` |
| `/gastos` | `Bills.jsx` | Gastos operativos — gate por `AuthRoles` |
| `/control-gastos` | `ExpenseStadistic.jsx` | Dashboard de gastos — gate `Finanzas, Administrador` (agregado 2026-07-19) |
| `/empleados` | — | Redirige a `/planilla` (`ExpenseEmployees.jsx` se eliminó por duplicar `Planilla.jsx` sin sus deducciones ni gate de roles) |
| `/planilla` | `Planilla.jsx` | Planilla completa (con deducciones) — gate `Finanzas, Administrador` |
| `/estadisticas` | `Estadisticas.jsx` | Dashboard financiero — gate `Finanzas, Administrador` |
| `/settings` | `Settings.jsx` | Configuración, categorías de gasto, gestión de usuarios |
| `/perfil` | `Profile.jsx` | Perfil propio, cambio de contraseña |
| `/about` | `About.jsx` | Placeholder, sin contenido real |

### B. Rutas públicas (`PublicLayout`, sin autenticación)

| Ruta | Página | Notas |
|---|---|---|
| `/` | `Homes.jsx` | Landing |
| `/menu` | `Menu.jsx` | Catálogo público de platillos (paginado, buscable) |
| `/contacto` | `contact.jsx` | Formulario de contacto — **el submit no hace nada** (no persiste) |
| `/promociones` | `Promotions.jsx` | Promociones hardcodeadas, sin BD |
| `/ordenar` | `Order.jsx` | Formulario de pedido dummy — solo `alert()`, no persiste |

### C. Rutas standalone (sin layout)

`/login`, `/register`, `/reset-password`, `/forgot-password`, `/*` → `NotFound.jsx`. (`/ChangePassword/*` se eliminó el 2026-07-19 por duplicar `/reset-password` sin tener ningún enlace real hacia él.)

### Navegación real (`NavBar.jsx`)

El navbar no enlaza a `/control-gastos` directamente (solo accesible por URL). Las rutas muertas `/recetas`, `/empleados` y `/Pedidos` se eliminaron el 2026-07-19 (ver «Cambios aplicados» al final).

Desde 2026-07-20: nivel superior — Dashboards, **Órdenes** (`/orders`), **Combos** (`/combos`), dropdown **Entregas** (Producción `/entregas`, Express `/entregas/express`, Combos `/entregas/combos`), dropdown Gestión (incluye "Ítems de Combo" → `/combo-items`), dropdown Finanzas.

---

## 3. Estado global (`src/context/AppContext.jsx`)

Solo contiene:
- **Auth:** `session`, `user`, `loading`, `isAuthenticated` (via `supabase.auth.getSession()` + `onAuthStateChange`).
- **Theme:** `theme` (`light|dark|system`, persistido en `localStorage['app-theme']`), `isDark`, `setTheme`, `toggleTheme`.
- Expone la instancia cruda de `supabase` para que cualquier componente haga `.schema('operations').from(...)`.

No hay estado de dominio (clientes/pedidos/pagos) en contexto — vive disperso en hooks por feature: `useCustomers`, `useCustomerFilters`, `useCustomerUI`, `useDashboardData`, `usePaymentStatistics`, `useExpenseStatistics`, `useDayRecipes`, `useMacros`, `useOrderRecipes` (no usado).

**Variables de entorno** (`.env`, usadas en `src/lib/supabase.js`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 4. Modelo de datos (esquema Supabase `operations`, salvo que se indique)

### Clientes y geografía
- **`clients`**: `id_client` PK, `name`, `phone`, `address_detail`, `district_id` FK, `latitude`, `longitude`, `client_type` (`personal|family`), `plan_type` (`estandar|nutricional`), `lunch_macro_profile_id` / `dinner_macro_profile_id` FK → `macro_profiles`, `is_active`, `created_at`.
- **`macro_profiles`**: `id_macro_profile` PK, `name`, `protein_value`, `carb_value` (enteros = **unidades**, no gramos), `is_active`.
- **`countries` / `provinces` / `cantons` / `districts`**: jerarquía geográfica de Costa Rica, usada en selects en cascada de `AddCustomer.jsx` y en el gráfico "clientes por distrito".

### Pedidos (jerarquía: orden → día → detalle)
- **`orders`**: `id_order` PK, `client_id` FK, `template_id` FK (nullable), `week_start_date`, `week_end_date`, `route_id` FK (null = express), `classification` (`Lunch|Dinner|both|Family`), `status` (`PENDING|PACKED|DELIVERED|CANCELLED`), `macro_profile_snapshot_id`, `protein_snapshot`/`carb_snapshot`.
- **`order_days`**: `id_order_day` PK, `order_id` FK, `day_of_week`, `delivery_date`, `status` (sincronizado automáticamente por trigger, ver §7).
- **`order_day_details`**: `id_order_day_detail` PK, `order_day_id` FK, `recipe_id` FK, `quantity`, `protein_value_applied`/`carb_value_applied`, `status` (mismo enum de 4 valores; es el nivel real donde cocina/empaque/entrega actúan).
- **`order_day_recipe_overrides`**: `order_day_detail_id` FK, `name`, `category` (`protein|carb|extra`) — sustituye ingredientes de una receta para un plato entregado específico.

### Recetas y plantillas
- **`recipes`**: `id_recipe` PK, `name`, `description`, `image_url` (Storage bucket `Recipes`), `is_active`.
- **`recipe_ingredients`**: `id_recipe_ingredient` PK, `recipe_id` FK, `name`, `category` (`protein|carb|extra`).
- **`order_templates`**: `id_template` PK, `name`, `description`, `meal_type` (`Lunch|Dinner`), `is_active`.
- **`order_template_days`**: `id_template_day` PK, `template_id` FK, `day_of_week`.
- **`order_template_details`**: `id_template_detail` PK, `template_day_id` FK, `recipe_id` FK, `quantity`, `macro_modifiable` (bool, siempre `false`, sin uso real).

### Rutas de entrega
- **`routes`**: `id_route` PK, `name`, `description`, `is_active`, `route_type` (`complete|individual|family|NULL`; `NULL` = ruta personalizada).
- **`route_delivery_days`**: `id_delivery_day` PK, `route_id` FK, `day_of_week`.

### Pagos
- **`payments`**: `id_payment` PK, `client_id` FK (nullable desde migración de ingreso manual), `payment_type` (`monthly|weekly|express|other`), `amount`, `currency` (`CRC`), `payment_date` (nullable desde 2026-07-20 — ver abajo), `period_start_date`/`period_end_date` (nullable, solo `payment_type='monthly'`, migración `20260720_monthly_payment_period_dates.sql`), `closed_at` (nullable, solo `monthly`, migración `20260720_close_monthly_payment.sql`), `status` (`pending|paid|cancelled`), `notes`, `created_at`.
  - **Semántica de `payment_date` (desde 2026-07-20, todos los tipos)**: `payment_date` representa **cuándo se cobró de verdad**, no cuándo se registró el pago. Se llena sola con la fecha de hoy (o la fecha elegida, para weekly/express) si el pago se crea directamente como `paid`; si se crea `pending` o `cancelled`, queda en `NULL` hasta que alguien lo marca `paid` (desde el asistente de pedidos, desde Ingresos/`Payments.jsx`, o desde el detalle de cliente/`PaymentsSection.jsx`), momento en el que se completa automáticamente. Alcance inicial (2026-07-19) fue solo `monthly`; se extendió a `weekly`/`express` el 2026-07-20. `other` (ingreso manual vía `ManualIncomeModal.jsx`) no se tocó.
  - **`period_start_date`/`period_end_date`** (solo `monthly`): marcan el período que cubre el pago (hasta 4 órdenes) — se calculan automáticamente al crear el pago: inicio = hoy, fin = hoy + 30 días.
  - **`closed_at`** (solo `monthly`, 2026-07-20): si no es `NULL`, el pago se cerró manualmente desde Ingresos antes de completar las 4 órdenes y ya no se ofrece para reutilizar en el asistente de pedidos, sin importar cuántas órdenes tenga vinculadas.
- **`payment_orders`**: `id_payment_order` PK, `payment_id` FK, `order_id` FK — un pago `monthly` puede cubrir hasta **4 órdenes** (regla solo en código, no en BD).

### Combos (pedidos puntuales por categorías, distinto del flujo semanal/express)
Añadido 2026-07-20. Un combo NO usa `recipes`/`order_templates` — tiene su propio catálogo y flujo, pensado para pedidos puntuales (una entrega, sin recurrencia).
- **`combo_items`**: `id_combo_item` PK, `category` (`arroz|proteina|acompanamiento|extra|plato_extra`), `name`, `portion_size_g` (solo arroz/proteína — porción fija en gramos), `recipe_id` FK nullable → `recipes` (enlace opcional), `is_active`. Catálogo reutilizable entre semanas, administrado en `/combo-items`.
- **`combo_weeks`**: `id_combo_week` PK, `week_start_date`/`week_end_date`, `base_price`, `status` (`open|closed`). El combo que el admin arma para una semana dada.
- **`combo_week_categories`**: `id_combo_week_category` PK, `combo_week_id` FK, `category`, `max_selections` (cuántos ítems puede elegir el cliente en esa categoría, definido por el admin al armar el combo).
- **`combo_week_category_items`**: qué ítems del catálogo están habilitados para una categoría esa semana; `extra_price` (solo relevante en `plato_extra` — costo adicional de ese ítem, fijado por el admin junto con el precio base).
- **`combo_orders`**: `id_combo_order` PK, `combo_week_id` FK, `client_id` FK, `delivery_date`, `price` (snapshot = `base_price` + extras elegidos), `status` (`PENDING|PACKED|DELIVERED|CANCELLED`, transición a nivel de todo el pedido, no por ítem), `payment_id` FK nullable → `payments` (`payment_type='combo'`).
- **`combo_order_selections`**: qué ítems eligió el cliente en su pedido (`combo_order_id`, `combo_item_id`, `category`).
- RLS: mismo patrón abierto-a-autenticados que el resto de tablas de negocio (migración `20260720_combos_schema.sql`).

### Gastos y planilla
- **`expenses`**: `id_expense` PK, `description`, `category_id` FK, `expense_date`, `amount`, `created_by`.
- **`expense_categories`**: `id_expense_category` PK, `name`, `is_active`.
- **`empCost`** (nombre/columnas legacy en PascalCase): `id` PK, `Name`, `Hours` (también usado como "días"), `Amount`, `WorkDate`, `payment_type` (`hours|days`), `Created_By`.
- **`emp_cost_deductions`**: `id` PK, `emp_cost_id` FK, `description`, `amount`.

### Usuarios y roles
- **`operations."Roles"`**: `id`, `name` (valores conocidos: `Administrador`, `Finanzas`, `Clientes`; con espacios en blanco en datos reales — el código hace `.trim()`).
- **`operations."userRoles"`**: `userId` FK → `auth.users`, `rolId` FK → `Roles` (N:M).
- **`operations.profiles`**: listado de gestión de usuarios.
- **`public.profiles`**: perfil vinculado a Supabase Auth (`id = auth.uid()`), `name`, `role` (campo `role='operador'` que **no se usa en ningún otro lugar** del código — probablemente reemplazado por el sistema Roles/userRoles).

---

## 5. Seguridad y roles (RLS)

Migración clave: `supabase/migrations/20260704_rls_policies.sql`.

- **Tablas abiertas** (cualquier usuario autenticado, CRUD completo): `clients, countries, provinces, cantons, districts, macro_profiles, routes, route_delivery_days, recipes, recipe_ingredients, order_templates, order_template_days, order_template_details, payments, payment_orders, orders, order_days, order_day_details, order_day_recipe_overrides`.
- `recipes` también tiene SELECT anónimo (para el catálogo público `/menu`).
- **Tablas restringidas** (solo `Finanzas`/`Administrador`, vía función `operations.user_has_role(role_names text[])`): `expenses, expense_categories, empCost, emp_cost_deductions`.
- `Roles`: SELECT abierto, escritura solo `Administrador`.
- `userRoles`: cada usuario ve sus propias filas; `Administrador` ve todas.
- `profiles` (ambos esquemas): fila propia + `Administrador` ve todas.
- **No existe `clients.auth_user_id`** → el rol `'Clientes'` no puede implementar "un cliente solo ve sus propios datos"; hoy es, en la práctica, un rol interno más.

**Autorización en el cliente:** componente `AuthRoles.jsx` (gate visual, no es seguridad real — la seguridad real es RLS). Aplicado de forma **inconsistente**: `Payments`, `Bills`, `Planilla`, `Estadisticas`, `Customers/Customer` sí lo usan; `ExpenseEmployees`, `ExpenseStadistic` (datos financieros) NO lo usan; `Main.jsx` importa `AuthRoles` pero nunca lo aplica.

---

## 6. Trigger de base de datos relevante

`operations.sync_order_day_status_from_details()` (migración `20260607_detail_status.sql`): AFTER INSERT/UPDATE/DELETE en `order_day_details`, recalcula `order_days.status`:
- `DELIVERED` si todos los detalles están entregados.
- `PACKED` si ninguno está pendiente.
- si no, `PENDING`.

Permite que una orden "both" (almuerzo+cena) se empaque/entregue de forma independiente por plato, manteniendo el status a nivel de día sincronizado.

---

## 7. Módulos funcionales

### 7.1 Clientes
`src/pages/customers.jsx`, `customer.jsx`, `components/AddCustomer.jsx`, `CustomerCard.jsx`, `CustomerDetailModal.jsx`, `CustomerTable.jsx`, hooks `useCustomers`, `useCustomerFilters`, `useCustomerUI`.

- Alta/edición combinadas en `AddCustomer.jsx`: tipo (`personal|family`), plan (`estandar|nutricional`, derivado de valores de macro), selects en cascada país→provincia→cantón→distrito, ubicación en mapa (`SafeMap`). Al crear, inserta 2 `macro_profiles` (almuerzo + cena) antes del cliente.
- Baja lógica (`is_active=false`) y reactivación.
- Detalle de cliente: paneles de macros, historial de pagos y de pedidos, mapa.
- Gate de roles: `Administrador, Clientes`.

### 7.2 Pedidos
`src/pages/Orders.jsx` (real), `components/AddOrder.jsx`, `EditOrder.jsx`, `OrderAdjustments.jsx`, `orderUtils.js`, `useDayRecipes.js`, `useMacros.js`.

- Un **pedido** = plan semanal de un cliente para una `classification` (Lunch/Dinner/both/Family), que se expande en `order_days` (por día) y `order_day_details` (por plato).
- `AddOrder.jsx`: wizard de 5 pasos (Cliente → Menú → Ajustes → Pago → Confirmar). Reglas de negocio:
  - **Resolución de semana**: si se registra lunes/martes, la entrega es en la semana actual; cualquier otro día, la siguiente semana.
  - **Resolución de fecha de entrega**: un día de comida se asigna al día de ruta más cercano hacia atrás (ciclo domingo-primero).
  - **Resolución automática de ruta**: `complete` si el menú es "both" o tiene ≥3 platos extra; si no, `individual`; clientes `family` → ruta `family`.
  - **Reutilización de pago mensual**: busca pagos `monthly` existentes del cliente con menos de 4 órdenes vinculadas y ofrece asociar en vez de duplicar. Desde el 2026-07-20 esta búsqueda solo considera pagos con `payment_date` dentro de los **últimos 30 días** (antes no tenía ningún filtro de fecha y podía ofrecer pagos de meses atrás — ver §8, punto 7).
- `EditOrder.jsx`: borra y re-inserta días/detalles/overrides al guardar (no hace diff).
- Pedidos Express: mismo día, sin ruta ni plantilla.

### 7.3 Recetas / Producción de cocina
CRUD de recetas: `src/pages/Menus.jsx`, `AddRecipe.jsx`, `EditRecipe.jsx`, `RecipeCard.jsx` (ruta `/menus`; **`/recetas` está muerta**).

Producción (`src/pages/Deliveries.jsx`, ruta `/entregas`), pestañas **Cocina → Empaque → Entrega → Express**:
- `Kitchen.jsx` (`groupByRecipe`): agrupa `order_day_details` del día por receta + "huella" de ingredientes (variantes por override individual). Cocina solo ve `PENDING`, puede marcar `PACKED` en bloque.
- `Package.jsx`: ve `PENDING`+`PACKED`, empaca/desempaca/entrega, selección múltiple.
- `Delivered.jsx`: ve `DELIVERED` agrupado por cliente/orden, permite "devolver a empaque".
- `Express`: mismas 3 subvistas, filtradas a pedidos de hoy con `route_id = null`.
- Los cambios de estado ocurren a nivel de `order_day_details`; el trigger de BD sincroniza `order_days`.
- `ProductionPrintReport.jsx`: reporte imprimible (ingredientes por proteína/carbo, tabla de platos).
- **Bug conocido**: en `Deliveries.jsx`, la subvista "Entrega" dentro de Express llama `onUndeliver={markPacked}` sin pasar `markPacked` como prop a `ExpressView` → error de referencia al usar "devolver" dentro de Express.

### 7.4 Menús y plantillas
- **Plantillas** (`order_templates`): planes semanales reutilizables (nombre, `meal_type`, asignación día→recetas). `AddTemplate.jsx`: wizard de 2 pasos. Usadas por `AddOrder.jsx` para pre-poblar el menú.
- `Menu.jsx` (público, `/menu`): catálogo paginado y buscable de recetas activas; botón "Ordenar" abre un modal con el formulario de contacto genérico (no funcional, ver §9).

### 7.5 Rutas de entrega
`src/pages/Routes.jsx`, `AddRoute.jsx`, `RouteCard.jsx`, `RouteSelector.jsx`, `SafeMap.jsx`.

- `route_type` distingue rutas "de sistema" (`complete/individual/family`, no eliminables) de rutas personalizadas (`NULL`, eliminación lógica).
- `AddRoute.jsx`: nombre/descripción + selección múltiple de días → `route_delivery_days`.
- Dos patrones distintos de mapa en el código: `SafeMap.jsx` (montaje imperativo, evita crashes con Framer Motion) vs. `react-leaflet` `<MapContainer>` directo (usado en `customer.jsx`, `Main.jsx`).

### 7.6 Pagos y facturación
`src/pages/Payments.jsx` (`/pagos`), `Bills.jsx` (`/gastos`), `PaymentsSection.jsx`, `usePaymentStatistics.js`.

- Estados de pago: `pending|paid|cancelled`. Tipos: `monthly` (hasta 4 órdenes), `weekly`, `express`, `other` (ingreso manual sin cliente, vía `ManualIncomeModal.jsx`).
- `Payments.jsx`: pestañas Esta Semana / Historial (búsqueda + filtro de fechas) / Estadísticas. Edición de estado individual y masiva, edición de monto con confirmación.
- Solo pagos con `status='paid'` cuentan como ingreso real en las estadísticas.
- Gate de roles: `Finanzas, Administrador`.
- **Pagos `monthly` — período vs. fecha de pago (2026-07-20)**: al crear un pago mensual desde el asistente de pedidos (`AddOrder.jsx`/`StepPayment.jsx`) ya no se pide una "fecha de pago" manual; en su lugar se calcula automáticamente `period_start_date`/`period_end_date` (hoy → hoy+30). `PaymentTable.jsx` muestra el período debajo de la fecha de pago para los pagos `monthly`.
- **`payment_date` en pending → se completa al pagar (2026-07-20, todos los tipos)**: para `monthly`, `weekly` y `express`, si el pago se deja `pending` (o `cancelled`) al crearlo, `payment_date` queda en blanco y el campo de fecha ni se muestra en el formulario (`StepPayment.jsx` muestra una nota en su lugar); se completa automáticamente en el instante en que alguien lo marca `paid` — desde `Payments.jsx` (Ingresos), desde `PaymentsSection.jsx` (detalle de cliente), o al crearlo directamente como `paid`. `other` (ingreso manual) no se tocó.
- **Cerrar pago mensual manualmente (2026-07-20)**: desde Ingresos (`Payments.jsx`/`PaymentTable.jsx`), un pago `monthly` con menos de 4 órdenes puede cerrarse a mano (ícono de candado) si el cliente no va a usar los cupos restantes ese período. Muestra un modal de advertencia (`ConfirmDialog`) antes de confirmar. Al cerrarlo se marca `closed_at`, deja de ofrecerse en el asistente de pedidos, y se muestra una etiqueta "Cerrado" en la tabla. No está disponible desde `PaymentsSection.jsx` (detalle de cliente) — es exclusivo de la vista de Ingresos, a pedido del usuario.

### 7.7 Gastos, planilla y empleados
- `Bills.jsx` (`/gastos`, gate de roles): gestiona `expenses` por categoría.
- `ExpenseStadistic.jsx` (`/control-gastos`, **sin gate**): dashboard de solo lectura combinando `expenses` + `empCost`.
- `ExpenseEmployees.jsx` (`/empleados`, **sin gate**): versión simple de planilla, sin mostrar deducciones (aunque el formulario sí las soporta).
- `Planilla.jsx` (`/planilla`, gate `Finanzas, Administrador`): versión completa con `emp_cost_deductions`, neto/bruto. Parece haber reemplazado a `ExpenseEmployees.jsx` sin que esta se elimine.
- `AddExpenseEmployee.jsx`: tipo de pago `hours|days`, líneas de deducción dinámicas, neto = bruto − Σdeducciones.

### 7.8 Estadísticas / Dashboards
- `Main.jsx` (`/main`, operativo): conteo de clientes, entregas por período, % clientes activos, % express, gráficos (entregas/día, top recetas, clasificación de comidas, tipo de orden, clientes activos/inactivos, clientes por distrito, mapa de ubicaciones).
- `Estadisticas.jsx` (`/estadisticas`, financiero, gate `Finanzas, Administrador`): pestañas Gastos / Ingresos / Comparativa (ingreso vs gasto, flujo acumulado, balance diario) / Planilla.
- `chartUtils.jsx`: utilidades centralizadas (formato CRC, buckets por semana ISO, paletas de color, presets de fecha, etiquetas de estado de pago).

### 7.9 Autenticación y usuarios
`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `ChangePassword.jsx`, `Profile.jsx`, `Module/Users.jsx`, `components/auth/AuthRoles.jsx`, `components/user/AddUser.jsx`.

- Auth 100% Supabase (email/contraseña), sin OAuth ni MFA.
- Autorización por roles vía tabla `Roles` × `userRoles` (N:M), no por custom claims de Supabase.
- `Module/Users.jsx` (dentro de Settings): matriz de asignación de roles por usuario.
- `AddUser.jsx`: creación de usuario (signUp + insert en `public.profiles`), sin asignar rol — debe hacerse aparte en la matriz.
- **Duplicación**: `ResetPassword.jsx` y `ChangePassword.jsx` implementan el mismo flujo de recuperación de contraseña de forma independiente.
- `src/lib/delete-user.js` es en realidad una **Edge Function de Supabase (Deno)**, no código de cliente — no está conectada a ninguna UI.

### 7.10 Público / marketing
`Homes.jsx`, `Promotions.jsx` (hardcodeado), `Menu.jsx`, `About.jsx` (placeholder), `contact.jsx` (formulario sin `onSubmit` funcional), `ContactRequest.jsx` (muerto).

---

## 8. Reglas de negocio clave (para tener presente en cualquier cambio)

1. **Macros = unidades enteras**, no gramos ni calorías (`MACRO_UNIT = 'ud.'`). El valor "estándar" es `protein_value=4, carb_value=2`, definido como única fuente de verdad en `STANDARD_MACRO` (`src/components/orderUtils.js`) y usado tanto en `AddCustomer.jsx` como en el asistente de pedidos (`AddOrder.jsx`, `OrderAdjustments.jsx`, `StepExpressRecipes.jsx`). Antes del 2026-07-19 el asistente de pedidos usaba `1/1`, un valor distinto e inconsistente — ya corregido.
2. **Máquina de estados de plato/día/pedido**: `PENDING → PACKED → DELIVERED` (+ `CANCELLED`, sin flujo de UI que lo dispare hoy). Vive en `order_day_details`, se propaga a `order_days` vía trigger de BD.
3. **Máquina de estados de pago**: `pending → paid` / `pending → cancelled`.
4. **Resolución de fecha de entrega**: el día de comida se asigna al día de ruta más cercano hacia atrás, con domingo como índice -1 (antes de lunes). Desde el 2026-07-19 esta lógica vive **solo** en `orderUtils.js` (`cycleIdx`, `getAbsoluteDate`, `getDateForDay`) y `Deliveries.jsx` la importa de ahí en vez de tener su propia copia.
5. **Clientes `family`**: sin perfil de macros, entrega solo viernes, siempre `classification='Family'`, una sola plantilla semanal.
6. **Pedidos Express**: mismo día, `route_id = null`, se gestionan aparte en cocina/empaque/entrega.
7. **Tope de 4 órdenes por pago mensual**: solo se valida en el cliente (`AddOrder.jsx`), no hay constraint en BD. Se probó reforzarlo con un trigger (`operations.enforce_monthly_payment_order_cap`) el 2026-07-19, pero se revirtió el mismo día (trigger y función eliminados de la BD con `DROP TRIGGER`/`DROP FUNCTION`, y el archivo de migración se quitó del repo) — volvió a quedar como estaba antes.
7bis. **Ventana de reutilización de pago mensual — bug corregido 2026-07-20**: la consulta que arma la lista "pago mensual disponible" en el paso de Pago del asistente de pedidos no tenía filtro de fecha, así que ofrecía cualquier pago `monthly` del cliente con espacio libre sin importar cuán viejo fuera (confirmado con datos reales: varios clientes —Nazira Ordoñez, Cristiam Acuña, Maria José Ruiz, Daniela Gonzales, Erick Vasquez, Joseph Rojas— tenían hasta 4 pagos mensuales simultáneos ofrecidos, con hasta ~2 meses de diferencia entre sí). Corregido agregando `.gte('payment_date', hace 30 días)` a la consulta en `AddOrder.jsx`. Verificado en vivo con Playwright contra el entorno real: antes de la corrección un cliente mostraba 4 pagos disponibles (incluido uno de hace 50 días), después de la corrección solo 3 (los de los últimos 30 días).
7ter. **Causa raíz de la fragmentación de pagos mensuales — encontrada y corregida 2026-07-20**: investigando por qué a los mismos clientes de 7bis se les seguían fragmentando los pagos incluso después de una limpieza manual previa (`merge_duplicate_monthly_payments.sql`), se reconstruyó la línea de tiempo exacta (cruzando `created_at` de `orders` y `payments`) para la clienta Daniela Gonzales Arguello. Se encontró que el tipo de pago sugerido automáticamente en el paso "Pago" del asistente (`familyClient || menuType === 'both' ? 'monthly' : 'weekly'`) **solo sugiere "Mensual" y auto-selecciona el pago existente cuando el pedido de esa semana es "Ambos" (almuerzo+cena)**. Los 8 pedidos históricos de esta clienta fueron siempre de un solo tiempo de comida (nunca "Ambos"), así que la reutilización automática nunca se activó — el personal tenía que darse cuenta y cambiar manualmente a "Mensual" cada vez, y cuando no lo hacía (p. ej. procesando varios clientes seguidos en una sola sesión, patrón semanal por lotes observado en los datos), se creaba un pago nuevo en vez de reutilizar uno existente con espacio. Confirmado con la cronología real: de 8 pedidos, 4 crearon pago nuevo y 4 reutilizaron uno existente, sin relación con cuánto espacio tenían los pagos previos disponibles.
   - **Corregido** en `AddOrder.jsx`: ahora, si el cliente tiene un pago mensual disponible (con los últimos 30 días), el sistema cambia automáticamente el tipo de pago a "Mensual" y lo auto-selecciona, **sin importar si el pedido puntual es de un solo tiempo de comida o "Ambos"** — la existencia de un pago mensual abierto es una señal más confiable del plan de facturación real del cliente que el tipo de menú de un pedido específico.
   - Verificado con Playwright contra el entorno real: se recreó exactamente el escenario que fallaba (pedido de solo "Almuerzo" para Daniela Gonzales Arguello) y se confirmó que el panel "Pago Mensual Disponible" ahora aparece automáticamente con el pago correcto preseleccionado, sin que el personal tenga que darse cuenta y cambiarlo a mano. No se completó el envío del pedido de prueba (se abandonó en el paso 4) para no crear datos de prueba en la base de datos real; se verificó que no quedó ninguna orden nueva creada.
7quater. **Limpieza de datos fragmentados existentes — 2026-07-20**: el fix de 7ter evita fragmentación futura, pero no corrige los pagos ya fragmentados de antes. Se fusionaron manualmente (con respaldo previo del estado completo) los pagos `pending` de 4 clientes, respetando el tope de 4 órdenes y **sin tocar ningún pago `paid`**: Maria José Ruiz (4 pagos pending → 2), Daniela Gonzales Arguello (3 → 2), Erick Vasquez Mendoza (3 → 2), Joseph Rojas Solis (4 → 2). Se verificó que el total de vínculos orden↔pago (`payment_orders`) se mantuvo exactamente igual antes y después (30 filas), es decir, no se perdió ni duplicó ninguna orden. Nazira Ordoñez y Cristiam Acuña Rodriguez no necesitaron cambios (0-1 pago pendiente, o ya óptimamente distribuidos).
7quinquies. **Período de pago vs. fecha de pago en pagos `monthly` — feature nueva 2026-07-20**: a petición del usuario, los pagos mensuales ya no usan una única `payment_date` para todo. Ahora tienen `period_start_date`/`period_end_date` (automáticos: hoy → hoy+30, migración `20260720_monthly_payment_period_dates.sql`) representando el período que cubren, y `payment_date` pasa a representar únicamente cuándo se cobró de verdad: se llena sola si el pago se crea ya `paid`, queda `NULL` si se crea `pending`, y se completa automáticamente el momento en que se marca `paid` (desde el asistente de pedidos, desde Ingresos, o desde el detalle de cliente). Se hizo backfill retroactivo de los pagos `monthly` existentes (`period_start_date = payment_date` original, `period_end_date = payment_date + 30 días`) y se quitó el `NOT NULL` de `payment_date`. Alcance: solo `payment_type='monthly'`; `weekly/express/other` siguen igual que siempre. Verificado end-to-end con Playwright contra el entorno real: se creó un pedido mensual `pending` nuevo (cliente sin pagos previos) y se confirmó `payment_date=NULL, period_start=hoy, period_end=hoy+30`; luego se replicó exactamente la lógica de "marcar como pagado" y se confirmó que `payment_date` se completa con la fecha de hoy. Los datos de prueba se eliminaron por completo al terminar.
8. **Variantes de ingredientes**: un plato puede tener ingredientes distintos a los de la receta base (`order_day_recipe_overrides`); cocina las trata como "variantes" separadas de producción.

---

## 9. Deuda técnica / código muerto — estado al 2026-07-19

La mayoría de los hallazgos originales de esta sección se corrigieron el 2026-07-19 (ver «Cambios aplicados» al final). Quedan **intencionalmente sin tocar** 3 puntos, marcados 🔴 abajo, por decisión explícita (se consideran de mayor riesgo/impacto y se dejaron para abordar aparte):

**🔴 Pendientes (no tocados a propósito):**
- ~~`Deliveries.jsx`: "devolver a empaque" dentro de la subvista Express sigue fallando~~ — **corregido de forma incidental el 2026-07-20** al separar Express en su propia pantalla (`DeliveriesExpress.jsx`), ver §15.
- `contact.jsx`: usado en `/contacto` y en modales "Ordenar" de `Menu.jsx`/`Promotions.jsx`, sigue **sin recibir `onSubmit`** — no persiste nada, formulario roto en producción. Lo mismo aplica a `/ordenar` (`pages/Order.jsx`), que solo hace `alert()`.
- RLS sigue abierta para cualquier usuario autenticado en las tablas de negocio (`clients`, `orders`, `payments`, `routes`, `recipes`, etc. — ver §5). Solo `expenses/expense_categories/empCost/emp_cost_deductions` y las tablas de roles están restringidas.

**Ya no vigentes / resueltos (ver «Cambios aplicados»):**
- Rutas muertas `/recetas`, `/Pedidos`, `/empleados` → eliminadas.
- Componentes/hooks no importados (`components/Orders.jsx`, `OrdersSection.jsx`, `HistoryView.jsx`, `CustomerDetail.jsx`, `ClientDeliveryCard.jsx`, `ClientPackingCard.jsx`, `HeatmapLayer.jsx`, `useOrderRecipes.js`, `payment/PaymentAdd.jsx`, `ContactRequest.jsx`, `ContactCard.jsx`, `customer/InactiveCustomerCard.jsx`, `Offcanvas.jsx`, `utils/DAY_ORDER.js`, `utils/DAY_LABELS.js`) → eliminados.
- `ExpenseEmployees.jsx` vs `Planilla.jsx` → `ExpenseEmployees.jsx` eliminado, `/empleados` redirige a `/planilla`.
- `ResetPassword.jsx` vs `ChangePassword.jsx` → `ChangePassword.jsx` eliminado; su manejo de enlaces inválidos se incorporó a `ResetPassword.jsx`.
- `components/MacroPanel.jsx` vs `components/macro/MacroPanel.jsx` → fusionados en un solo componente con modo editable/solo-lectura.
- Gate de roles ausente en `ExpenseStadistic.jsx`/`/control-gastos` → agregado (`Finanzas, Administrador`).
- Lógica de fecha de entrega duplicada (`orderUtils.js` vs `Deliveries.jsx`) → unificada en `orderUtils.js`.
- Inconsistencia de macro "estándar" (4/2 vs 1/1) → unificada en `STANDARD_MACRO` (4/2).
- Manejo de errores silencioso en borrado en cascada de pedidos (`pages/Orders.jsx`) y en `ExpenseCategories.jsx` → ahora todos los pasos verifican error y notifican al usuario.

**No es deuda técnica, se mantiene tal cual:**
- `src/lib/delete-user.js` (Edge Function de Supabase huérfana, no desplegada) — se dejó intacta porque es una funcionalidad administrativa útil sin terminar de conectar, no código muerto per se; conectarla requeriría desplegarla como función y agregar un botón en la UI.
- `DatePicker.jsx` vs `DateRangeFilter.jsx` — ambos siguen en uso en distintas pantallas; unificarlos es un cambio de UX (no solo de código) que no se abordó en esta pasada.
- Agregación de gastos duplicada entre `GastosPanel.jsx` y `ExpenseStadistic.jsx` — sigue duplicada en el cliente; el primer paso hacia resolverlo son las vistas SQL nuevas (`v_expenses_daily_summary`, `v_emp_cost_daily_summary`, `v_total_expenses_daily`, `v_payments_daily_summary`, migración `20260719_dashboard_summary_views.sql`), pero **el frontend todavía no las consume** — ver «Cambios aplicados».

---

## 10. Índice de archivos clave

| Área | Archivos |
|---|---|
| Enrutamiento/layout | `src/App.jsx`, `src/layout/MainLayout.jsx`, `src/layout/PublicLayout.jsx` |
| Estado global | `src/context/AppContext.jsx`, `src/lib/supabase.js` |
| Migraciones | `supabase/migrations/20260414_macros_units_only.sql`, `20260607_detail_status.sql`, `20260703_manual_income.sql`, `20260704_rls_policies.sql`, `20260705_payment_status_paid.sql`, `20260719_dashboard_summary_views.sql`, `20260720_monthly_payment_period_dates.sql`, `20260720_close_monthly_payment.sql`, `20260720_combos_schema.sql` |
| Diagnóstico SQL | `supabase/find_duplicate_monthly_payments.sql`, `supabase/merge_duplicate_monthly_payments.sql`, `debug-route-days.sql` |
| Motor de pedidos | `src/components/orderUtils.js`, `AddOrder.jsx`, `EditOrder.jsx`, `OrderAdjustments.jsx`, `useDayRecipes.js`, `useMacros.js`, `orders/steps/StepPayment.jsx` |
| Cocina/producción | `src/components/Kitchen.jsx`, `Package.jsx`, `Delivered.jsx`, `KitchenPipeline.jsx` (pipeline Cocina/Empaque/Entrega compartido), `ProductionPrintReport.jsx`, `hooks/useOrderDayActions.js`, `src/pages/{Deliveries,DeliveriesExpress}.jsx` |
| Combos | `src/components/comboUtils.js`, `AddComboItem.jsx`, `pages/{ComboItems,Combos,DeliveriesCombos}.jsx`, `components/combos/{ComboWeekBuilder,AddComboOrder,ComboOrdersTab,ComboOrderCard,ComboHistoryView,ComboDeliveryView}.jsx` |
| Auth/roles | `src/components/auth/AuthRoles.jsx`, `src/Module/Users.jsx`, `src/pages/Login.jsx`, `Register.jsx` |

---

## 11. Cambios aplicados — 2026-07-19

A petición del usuario, se implementaron todas las recomendaciones marcadas 🟠 (importante), 🟡 (recomendado) y 🟢 (limpieza técnica), dejando sin tocar las 3 marcadas 🔴 (crítico) por decisión explícita. Detalle:

**Código (frontend):**
- `orderUtils.js`: se agregó `STANDARD_MACRO = { protein_value: 4, carb_value: 2 }` como única fuente de verdad; `AddCustomer.jsx`, `AddOrder.jsx`, `OrderAdjustments.jsx` y `StepExpressRecipes.jsx` ahora la importan en vez de redefinir el valor localmente (antes había un `1/1` inconsistente en el flujo de pedidos).
- `ExpenseStadistic.jsx`: envuelto en `<AuthRoles rolesNames={['Finanzas','Administrador']}>`, igual que `Bills.jsx`/`Planilla.jsx`/`Estadisticas.jsx`.
- `ResetPassword.jsx`: incorporó el manejo de enlaces inválidos/expirados (`error`/`error_description` en el hash de la URL) que antes solo tenía `ChangePassword.jsx`. `ChangePassword.jsx` y su ruta `/ChangePassword/*` se eliminaron (no tenían ningún enlace real hacia ellos en la app).
- `App.jsx`: ruta `/empleados` ahora redirige a `/planilla` con `<Navigate replace>`; se eliminaron las rutas `/recetas` y `/Pedidos`.
- `Deliveries.jsx`: ya no define su propia copia de `cycleIdx`/`isoOfDay`; importa `cycleIdx`, `getAbsoluteDate`, `toDateString`, `DAYS_ORDER`, `DAY_LABELS` desde `orderUtils.js`. Se eliminaron los archivos `utils/DAY_ORDER.js` y `utils/DAY_LABELS.js` (duplicados exactos, sin otros usos).
- `components/MacroPanel.jsx`: fusiona el panel editable (usado en el asistente de pedidos) y el de solo lectura (usado en el detalle de cliente) en un solo componente — modo automático según si recibe `onUpdate` o no. Se eliminó `components/macro/MacroPanel.jsx` y se actualizó el import en `pages/customer.jsx`.
- `pages/Orders.jsx` (`handleDeleteOrder`): cada paso del borrado en cascada (overrides → detalles → días → vínculo de pago → orden) ahora verifica su propio error y aborta con feedback al usuario en vez de continuar silenciosamente si un paso intermedio falla.
- `components/ExpenseCategories.jsx`: las 4 operaciones (cargar, crear, renombrar, activar/desactivar) ahora muestran un toast de error si fallan, en vez de fallar en silencio.
- `zod` agregado como dependencia; `AddCustomer.jsx` usa un esquema declarativo (`customerSchema`) como piloto — valida nombre obligatorio y, para clientes `personal`, que los 4 campos de macro sean enteros ≥ 0 (antes un campo vacío se convertía silenciosamente en `NaN` vía `parseInt()` y así llegaba a la base de datos).

**Archivos eliminados** (código muerto confirmado por búsqueda exhaustiva, sin ninguna referencia en el resto del código): `pages/Recipes.jsx`, `pages/Test.jsx`, `pages/ExpenseEmployees.jsx`, `pages/ChangePassword.jsx`, `components/Orders.jsx`, `components/OrdersSection.jsx`, `components/HistoryView.jsx`, `components/CustomerDetail.jsx`, `components/ClientDeliveryCard.jsx`, `components/ClientPackingCard.jsx`, `components/HeatmapLayer.jsx`, `components/useOrderRecipes.js`, `components/payment/PaymentAdd.jsx`, `components/customer/InactiveCustomerCard.jsx`, `components/Offcanvas.jsx`, `components/macro/MacroPanel.jsx`, `pages/ContactRequest.jsx`, `context/ContactCard.jsx`, `utils/DAY_ORDER.js`, `utils/DAY_LABELS.js`.

**Base de datos (migraciones en `supabase/migrations/`):**
- `20260719_dashboard_summary_views.sql`: vistas `operations.v_payments_daily_summary`, `v_expenses_daily_summary`, `v_emp_cost_daily_summary`, `v_total_expenses_daily` — resumen de ingresos/gastos/planilla por día, pensadas para reemplazar en el futuro las agregaciones que hoy hacen en JavaScript `useExpenseStatistics.js`, `usePaymentStatistics.js` y `chartUtils.buildIncomeStats`. **El frontend todavía no consume estas vistas** — es un primer paso aditivo; migrar los hooks a consumirlas requiere probarlo contra un entorno real antes de desplegar (cambia el volumen de datos que viaja al cliente). No aplicada automáticamente por el asistente — el usuario decide cuándo/si aplicarla vía SQL editor.
- ~~`20260719_enforce_monthly_payment_order_cap.sql`~~ (trigger de tope de 4 pedidos por pago mensual): se aplicó, causó un problema en producción y **se revirtió el 2026-07-20** — trigger y función eliminados de la BD (`DROP TRIGGER`/`DROP FUNCTION`) y archivo de migración eliminado del repo. El tope vuelve a validarse solo en el cliente, como antes de esta pasada de mejoras.

**Verificación:** `npm run build` compila sin errores; `npm run lint` bajó de 112 a 99 problemas (ninguno nuevo introducido — la diferencia son los archivos eliminados que ya tenían errores de lint).

**No se tocó (crítico, dejado a propósito):**
- ~~Bug de "devolver a empaque" en la subvista Express de `Deliveries.jsx`~~ — corregido de forma incidental el 2026-07-20, ver §15.
- Formularios públicos sin `onSubmit` funcional (`contact.jsx`, `/ordenar`).
- Políticas RLS abiertas en las tablas de negocio (clientes, pedidos, pagos, rutas, recetas, etc.).

---

## 12. Cambios aplicados — 2026-07-20

- **Revertido**: el trigger `operations.enforce_monthly_payment_order_cap` (migración `20260719_enforce_monthly_payment_order_cap.sql`) se había aplicado en Supabase y causó un problema en producción reportado por el usuario. Se eliminó de la BD (`DROP TRIGGER`/`DROP FUNCTION`) y el archivo de migración se quitó del repo. Ver §8 punto 7.
- **Corregido — filtro de 30 días en reutilización de pago mensual**: `AddOrder.jsx` ahora solo ofrece pagos `monthly` con `payment_date` dentro de los últimos 30 días (antes no filtraba por fecha en absoluto). Verificado con datos reales y con Playwright contra el entorno en vivo (login real, flujo completo del asistente de pedidos). Ver §8 punto 7bis para el detalle y una nota sobre un problema relacionado (pagos mensuales fragmentados) que queda pendiente de investigar aparte.
- **Corregido — etiqueta de macro "estándar" desactualizada**: al unificar `STANDARD_MACRO` a `4/2` el 2026-07-19, quedaron 3 botones (`OrderAdjustments.jsx` ×2, `StepExpressRecipes.jsx` ×1) que seguían mostrando el texto fijo "Estándar (1 ud.)" heredado del valor anterior, aunque ya aplicaban 4/2 al hacer clic — es decir, el botón funcionaba bien pero mostraba una etiqueta incorrecta. Detectado durante la prueba con Playwright de este mismo día. Ahora muestran `Estándar ({protein}/{carb} ud.)` leyendo directamente de `STANDARD_MACRO`.
- **Verificación**: `npm run build` compila sin errores. Se probó el flujo completo del asistente "Nuevo Pedido" (selección de cliente → menú "Ambos" → plantillas → ajustes de macros → pago) con Playwright contra el servidor de desarrollo y una sesión real autenticada, confirmando ambas correcciones visualmente.

---

## 13. Cambios aplicados — 2026-07-20 (continuación: cerrar pagos + fecha de pago en semanal/express)

A petición del usuario, dos features nuevas sobre pagos:

- **Cerrar pago mensual manualmente desde Ingresos**: migración `20260720_close_monthly_payment.sql` agrega `closed_at TIMESTAMPTZ` a `operations.payments`. `AddOrder.jsx` excluye pagos con `closed_at` no nulo de la reutilización (`.is('closed_at', null)`). `Payments.jsx` agrega `handleClosePayment` + estado `closingPayment` + un `ConfirmDialog` de advertencia (no destructivo, estilo ámbar, no rojo). `PaymentTable.jsx` agrega el ícono de candado (acción "Cerrar", visible solo si `onClosePayment` se pasa como prop, `payment_type='monthly'`, sin cerrar todavía, y con menos de 4 órdenes) y una etiqueta "Cerrado" junto al conteo de órdenes cuando `closed_at` está presente. **Solo en `Payments.jsx`** — `PaymentsSection.jsx` (detalle de cliente) no recibió esta acción, a pedido explícito del usuario ("desde el lado de ingresos").
- **`payment_date` en pending/paid extendido a `weekly` y `express`**: la regla implementada el 2026-07-19 solo para `monthly` (payment_date en blanco si pending, se completa al pasar a paid) ahora aplica a los tres tipos. En `AddOrder.jsx`, `effectivePaymentDate` ya no depende de `isMonthly` para decidir si guardar `null`. En `StepPayment.jsx`, el campo "Fecha de pago" para `weekly`/`express` ahora solo se muestra cuando `paymentStatus === 'paid'`; con `pending`/`cancelled` se reemplaza por una nota, igual que ya pasaba con el período de `monthly` (esto obligó a reordenar el formulario: "Estado" ahora va antes que "Fecha de pago", porque esta última depende de aquel). `buildStatusPayload` en `Payments.jsx` y el equivalente en `PaymentsSection.jsx` ya no restringen el autocompletado de `payment_date` a `payment_type='monthly'` — aplica a cualquier tipo que aún no tenga fecha.
- **Corregido de paso — filtros de fecha con pagos pending sin `payment_date`**: al generalizar el `payment_date` en blanco a todos los tipos, se encontraron (y corrigieron) 3 lugares en `Payments.jsx` que filtraban directamente por `p.payment_date` sin contemplar `NULL`, lo que hubiera hecho desaparecer pagos pending recién creados de la pestaña "Esta Semana", del filtro de "Historial" por rango de fechas, y de los gráficos de Estadísticas: se agregó un helper `effectiveDate(p) = payment_date || period_start_date || created_at` usado en los tres. También se le agregó `nullsFirst: false` al `.order('payment_date', ...)` de `Payments.jsx` y `PaymentsSection.jsx`, para que los pagos pending sin fecha no salten al principio del historial (comportamiento por defecto de Postgres al ordenar DESC con nulls).
- **Verificado con Playwright contra el entorno real** (sin dejar datos de prueba, verificado con consultas antes/después de cada limpieza):
  - Se creó un pago mensual con 1/4 órdenes para una clienta de prueba, se cerró replicando exactamente la lógica de `handleClosePayment` (no se pudo probar el clic real del botón — la cuenta de prueba no tiene rol Finanzas/Administrador para entrar a `/pagos`, y no se tocaron los roles reales del usuario para no alterar permisos productivos), y se confirmó en una segunda pasada por el asistente que el pago cerrado ya no aparece en "Pago Mensual Disponible".
  - Se creó un pedido semanal de un cliente sin pagos previos, con estado Pendiente: se confirmó visualmente que el campo "Fecha de pago" no se muestra (aparece la nota en su lugar), que sí aparece al elegir "Pagado", y en la base de datos que `payment_date` quedó en `NULL`. Se replicó la lógica de "marcar como pagado" y se confirmó que `payment_date` se completa con la fecha de hoy.

---

## 14. Cambios aplicados — 2026-07-20 (continuación: sección de Combos)

A petición del usuario, nueva sección "Combos" — tercer tipo de producto además de semanal/express, para pedidos puntuales (una entrega, sin recurrencia) armados por categorías con opciones que el administrador configura semana a semana. Ver §4 "Combos" para el modelo de datos completo (6 tablas nuevas, migración `20260720_combos_schema.sql`, RLS abierta igual que el resto de tablas de negocio).

**Frontend nuevo:**
- `src/components/comboUtils.js`: constantes compartidas (`COMBO_CATEGORIES` con su unidad — gramos para arroz/proteína, unidades para acompañamientos/extras/plato extra) y helpers (`computeComboPrice`, `formatComboQuantity`).
- `src/pages/ComboItems.jsx` + `src/components/AddComboItem.jsx`: CRUD del catálogo de ítems de combo, con pestañas por categoría. Nueva ruta `/combo-items`, enlace "Ítems de Combo" en el dropdown Gestión de la navbar.
- `src/components/combos/ComboWeekBuilder.jsx`: el admin configura el combo de la semana — precio base, y por categoría qué ítems del catálogo están disponibles + cuántos puede elegir el cliente (`max_selections`); para `plato_extra`, además el costo adicional de cada ítem elegido.
- `src/components/combos/AddComboOrder.jsx`: registra el pedido de un cliente contra el combo de la semana activo — selección por categoría respetando el tope configurado, precio calculado en vivo (`base_price` + extras elegidos), y el mismo patrón de pago ya usado en semanal/express (Estado antes que fecha; fecha de pago solo si `paid`, en blanco si `pending`, columna `payment_type='combo'` en `payments`).
- `src/components/combos/ComboOrdersTab.jsx`: pestaña "Combos" nueva en `Orders.jsx` (junto a Semana/Histórico) — CTA para configurar el combo semanal si no existe uno abierto, botón para registrar pedidos, y lista de pedidos ya registrados esa semana.
- `src/components/combos/ComboDeliveryView.jsx`: pestaña "Combos" nueva en `Deliveries.jsx` (junto a Cocina/Empaque/Entrega/Express) — mismo pipeline de 3 etapas (transición a nivel de todo el pedido, no por ítem, a diferencia del flujo semanal que es por detalle), más un selector "Por cliente" / "Por plato" (vista agregada: total en gramos/unidades por ítem de catálogo, sumando las órdenes visibles en la etapa activa — ej. "Arroz blanco: 3000 g").

**Verificado con Playwright contra el entorno real** (servidor de desarrollo + Supabase real, migración aplicada por el usuario): se crearon ítems de catálogo de las 5 categorías, se configuró un combo semanal (precio base ₡5000 + plato extra ₡1000), se registró un pedido de combo para una clienta de prueba con una selección por categoría, se confirmó el precio calculado (₡6000, correcto), se verificó el pedido en la lista de Órdenes > Combos y en Entregas > Combos (Cocina), se avanzó el estado Cocina → Empaque → Entrega confirmando cada transición, y se confirmó que la vista "Por plato" agrega correctamente el ítem de arroz. Todos los datos de prueba (catálogo, combo semanal, pedido, selecciones, pago) se eliminaron al terminar — confirmado con conteo de filas en 0 en las 6 tablas nuevas y en `payments` con `payment_type='combo'`.

`npm run build` compila sin errores. `npm run lint` pasó de 99 a 109 problemas — los 10 nuevos son del mismo tipo que ya existe de forma sistemática en el resto del código (`setState` síncrono en `useEffect` al montar, dependencias faltantes en hooks, y un falso positivo de `no-unused-vars` en un ícono usado dentro de JSX que ya afecta de forma idéntica a `TabButton` en `Deliveries.jsx` — limitación de este `eslint.config.js`, que no incluye `eslint-plugin-react`). Ninguno es una regresión de calidad real ni un error de lógica.

---

## 15. Cambios aplicados — 2026-07-20 (continuación: pantallas propias para Combos/Express + ajustes)

A petición del usuario, tras revisar visualmente la sección de Combos con Playwright se detectaron dos problemas de UX (el botón "Nuevo Pedido" de Órdenes quedaba visible sin sentido en la pestaña Combos; en Entregas, Cocina/Empaque/Entrega se repetían como pestañas internas justo debajo de la barra externa que ya las nombraba igual). Se resolvió separando Combos y Express en pantallas propias, además de tres ajustes puntuales pedidos por el usuario.

**Pantallas propias en vez de pestañas:**
- `Orders.jsx` (`/orders`) vuelve a ser exclusivamente Semana/Histórico de pedidos semanales/express — se le quitó la pestaña Combos (quedó bit a bit igual al archivo previo a la introducción de Combos).
- `Combos.jsx` (`/combos`, nueva): pantalla hermana de `Orders.jsx`, mismo patrón visual de pestañas Semana/Histórico. "Semana" reutiliza `ComboOrdersTab.jsx` sin cambios de lógica; "Histórico" es un componente nuevo, `ComboHistoryView.jsx`, que agrupa por `combo_weeks` (no por `orders.week_start_date`) y pagina de a 8 semanas, igual que `HistoryView` de `Orders.jsx`. Criterio de "actual vs. histórico": el `combo_weeks` más reciente por `id_combo_week` es el que se muestra en "Semana"; el resto es histórico (hoy no existe una acción para "cerrar" una semana de combo).
- `Deliveries.jsx` (`/entregas`) volvió a ser solo producción semanal (Cocina/Empaque/Entrega), sin Express ni Combos.
- `DeliveriesExpress.jsx` (`/entregas/express`, nueva) y `DeliveriesCombos.jsx` (`/entregas/combos`, nueva): la lógica de datos que antes vivía dentro de `Deliveries.jsx` (fetch de pedidos Express del día, fetch de `combo_orders` de la semana, y sus `markX` de cambio de estado) se movió a estas dos páginas nuevas.
- **Reutilización de código**: la barra de sub-pestañas Cocina/Empaque/Entrega + el switch entre `CocinaView`/`EmpaqueView`/`EntregaView` estaba duplicado (una vez inline en `Deliveries.jsx`, otra vez dentro del `ExpressView` original) — se extrajo una sola vez a `src/components/KitchenPipeline.jsx`, usado ahora por `Deliveries.jsx` y `DeliveriesExpress.jsx`. Las 6 funciones de transición de estado (`markPacked`, `markDelivered`, `markPending` y sus variantes `*Detail`) también estaban duplicadas entre ambos archivos — se extrajeron al hook `src/hooks/useOrderDayActions.js`. La tarjeta de un pedido de combo (cliente, estado, precio, selecciones) se extrajo a `src/components/combos/ComboOrderCard.jsx`, compartida entre `ComboOrdersTab.jsx` y `ComboHistoryView.jsx`.
- **Navegación (`NavBar.jsx`)**: "Entregas" pasó de link directo a dropdown (Producción/Express/Combos), igual patrón que "Gestión"/"Finanzas". Se agregó "Combos" como link de primer nivel, junto a "Órdenes".

**Ajustes de negocio:**
- **Precio de Plato Extra obligatorio**: `ComboWeekBuilder.jsx` ahora bloquea el guardado (con `sileo.error` señalando el ítem) si algún ítem de la categoría Plato Extra fue seleccionado sin un costo asociado > 0 — antes se guardaba silenciosamente como 0, lo que rompía el cálculo automático del precio final en `AddComboOrder.jsx`.
- **Reglas de pago de un pedido de combo**: se confirmó contra `orders/steps/StepPayment.jsx` que `AddComboOrder.jsx` ya sigue el mismo patrón (Estado antes que Fecha; fecha visible/editable solo si `status==='paid'`; nota informativa si no) desde que se implementó. Se alineó el rótulo "Estado del pago" → "Estado" para que se lea igual que en el asistente de pedidos semanal.

**Bug crítico resuelto de forma incidental**: el bug de "devolver a empaque" en la subvista Express (dejado sin tocar a propósito el 2026-07-19 por estar en la lista de "críticos") quedó corregido como efecto colateral de esta separación — `markPacked` ya no queda fuera de scope porque `DeliveriesExpress.jsx` define sus propios handlers (vía `useOrderDayActions`) en el mismo componente que usa `KitchenPipeline`. No era el objetivo de este cambio; se verificó con Playwright sembrando una orden Express de prueba en estado `DELIVERED` y confirmando que "Devolver a empaque" la revierte a `PACKED` sin errores (datos de prueba eliminados después).

**Verificación:** `npm run build` sin errores; `npm run lint` en 114 problemas (+5 sobre el baseline de 109 de la ronda anterior — mismo patrón sistémico del resto del código: `setState` síncrono en `useEffect` al montar y dependencias faltantes en hooks, sin regresiones reales). Verificado con Playwright contra el entorno real: navegación por el nuevo dropdown Entregas y el nuevo link Combos, bloqueo del guardado del combo semanal sin precio de Plato Extra, cálculo correcto del precio final (₡4.000 base + ₡1.500 extra = ₡5.500), recorrido completo Cocina→Empaque→Entrega en `/entregas/combos`, y verificación visual de la pestaña Histórico de `/combos` con 2 semanas (agrupado y tarjetas correctas). Todos los datos de prueba se eliminaron al terminar, confirmado en 0 filas.

---

*Generado automáticamente por Claude a partir de una revisión exhaustiva del código fuente. Mantener actualizado cuando cambien rutas, esquema de BD o reglas de negocio importantes.*
