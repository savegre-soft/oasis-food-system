# Tiempos de comida: Desayuno, Almuerzo y Cena (1, 2 o los 3 por pedido)

> Estado: **en producción desde 2026-09-20** (`main`, merge `14e3706`) y integrado en `Fase_2`
> (`d1cac95`, no desplegada a producción).
> Ramas de trabajo: `feature/categoria-desayunos` → `main` y → `Fase_2`.

## 1. Qué cambió (resumen de negocio)

Antes un pedido personal era de **Almuerzo**, **Cena** o **Ambos**. Ahora existe un tercer tiempo de
comida, **Desayuno**, y el asistente permite elegir **uno, dos o los tres** tiempos. "Ambos" pasa a
ser simplemente "Almuerzo + Cena". Todo el flujo (plantillas → pedido → producción → empaque →
entrega → pagos → portal del cliente) trata al Desayuno igual que a los otros dos tiempos.

## 2. Modelo de datos

| Cambio | Detalle |
|---|---|
| `clients.breakfast_macro_profile_id` | FK nullable a `macro_profiles`. **Opcional**: los clientes existentes no lo tienen. Nombre de FK: `clients_breakfast_macro_profile_id_fkey`. |
| `orders.classification` | Ya era `varchar(50)` sin CHECK. Nueva codificación (ver §3). |
| `order_templates.meal_type` | Admite `Breakfast` (varchar(20), sin CHECK). |
| `portal_template_overrides.meal_type` | CHECK ampliado a `Breakfast/Lunch/Dinner`. |
| `order_day_details.meal_type` | (Solo donde existe la columna: staging/`Fase_2`.) CHECK ampliado a `Breakfast/Lunch/Dinner`/NULL. |
| RPC `portal_get_client` | Devuelve también `breakfast_macro`. |
| RPC `portal_get_menu_options` | Resuelve plantilla semanal de `Breakfast` (override de staff → semana del mes) y la incluye en `templates` y `resolved_templates`. |
| RPC `portal_submit_order` | Acepta cualquier clasificación combinada; el snapshot de macros del pedido usa el **primer** tiempo. En `Fase_2` además guarda `meal_type` por detalle. |

### Migraciones

| Archivo | Rama | Estado |
|---|---|---|
| `supabase/migrations/20260920_breakfast_category.sql` | `main` y `Fase_2` | **Aplicada en producción** (2026-09-20) y en staging. Idempotente. Escrita sobre las funciones del portal de **producción** (sin `meal_type` por detalle). |
| `supabase/migrations/20260921_breakfast_portal_meal_type.sql` | solo `Fase_2` | Aplicada en staging. Definición **final** de `portal_submit_order` (meal_type por detalle + Desayuno + combinaciones) y CHECK de `order_day_details.meal_type` con `Breakfast`. |

> **Orden obligatorio al llevar `Fase_2` a producción:** `20260818_order_day_details_meal_type` →
> `20260818_portal_meal_type` → `20260921_breakfast_portal_meal_type`. Si se aplica la 0818 sin la
> 0921, el portal **pierde el soporte de desayuno** (la 0818 redefine `portal_submit_order` sin él y
> deja el CHECK solo con Lunch/Dinner).

## 3. Codificación de `orders.classification`

| Selección en el asistente | Valor guardado |
|---|---|
| Solo un tiempo | `Breakfast`, `Lunch` o `Dinner` |
| Almuerzo + Cena | `both` (**se conserva** por compatibilidad: 62 pedidos históricos) |
| Cualquier otra combinación | Tiempos en orden canónico (Breakfast, Lunch, Dinner) unidos por `+`: `Breakfast+Lunch`, `Breakfast+Dinner`, `Breakfast+Lunch+Dinner` |
| Cliente familiar | `Family` (sin tiempos individuales) |

Helpers únicos en `src/components/orderUtils.js` (no comparar strings a mano):

- `MEAL_TYPES`, `MEAL_META` (label, emoji, color por tiempo: 🌅 celeste, ☀️ ámbar, 🌙 índigo).
- `mealTypesOf(classification)` → lista de tiempos (`'both'` → Lunch+Dinner). `classificationOf(types)` es el inverso.
- `primaryMealType(c)` → primer tiempo (define el snapshot de macros del pedido).
- `mealLabel(c)` / `classificationLabel(c)` / `classificationEmoji(c)` / `classificationBadge(c)` (texto y clases con dark mode; combinaciones = teal, familiar = púrpura).
- `clientMacroKey(type)` → `breakfast_macro` | `lunch_macro` | `dinner_macro`.

## 4. Comportamiento por módulo

- **Clientes** (`AddCustomer`, `CustomerTable`, `CustomerDetailModal`, `pages/customer.jsx`, `useCustomers`): bloque "🌅 Desayuno (opcional)" con toggle Estándar/Nutricional. Vacío = sin perfil; si se llena un campo, ambos son obligatorios. `plan_type` = `estandar` solo si todos los tiempos que el cliente tiene son estándar. Editar un cliente sin perfil de desayuno crea el perfil al guardar.
- **Plantillas** (`AddTemplate`, `TemplateCard`, `WeeklyTemplateOverride`): tipo de menú Desayuno/Almuerzo/Cena; la plantilla de la semana del portal se puede anular por tiempo.
- **Asistente de pedido** (`AddOrder`, `StepMenu`, `OrderAdjustments`, `DayRecipeBlock`, `StepConfirm`):
  - Paso Menú: tres botones tipo interruptor (✓). Cada tiempo elegido pide su plantilla; se preselecciona la de la semana en curso.
  - Paso Ajustes: **un panel de macros por cada tiempo elegido (obligatorio)**. Sin perfil del cliente arranca en estándar (`STANDARD_MACRO`).
  - Con más de un tiempo: ruta sugerida `complete`, pago sugerido mensual, y cada receta tiene un interruptor de tiempo de comida.
  - Cada receta se guarda con los macros **de su propio tiempo** (antes en `both` todo salía con macros de almuerzo).
- **Express** (`StepExpressRecipes`): tres opciones (Desayuno/Almuerzo/Cena), macros del perfil del cliente o estándar.
- **Edición** (`EditOrder`): carga los macros de **todos** los tiempos del pedido (principal ← snapshot del pedido; los demás ← perfil actual del cliente o estándar), asigna cada receta a su tiempo y guarda cada una con los macros de su tiempo. En `main` (sin `meal_type` por detalle) el tiempo de cada receta existente se **infiere** comparando los macros aplicados; en `Fase_2` se lee de `order_day_details.meal_type`.
- **Producción / empaque / entrega** (`RecipeProductionCard`, `Package`, `Delivered`, `OrderBlock`, `OrderCard`, `OrderDetailModal`, `Orders`): badges y etiquetas con `mealLabel`/`classificationBadge`. `LabelPrintSheet` (Fase_2) reconoce Desayuno.
- **Pagos** (`PaymentTable`) y **Dashboard** (`useDashboardData`/`Main`): la dona de clasificación incluye Desayuno y "Combinado".
- **Portal del cliente** (`CustomerPortal`, `PortalOrderSummary`): tarjetas de macros por tiempo; el cliente elige uno o varios tiempos ("Continuar"); si solo tiene macros de un tiempo se elige solo.

## 5. Arquitectura de código (refactor)

Se eliminaron las props duplicadas `lunch*/dinner*`: `OrderAdjustments` recibe
`macrosByType`, `onUpdateMacro(type, field, value)`, `clientMacros`, `onApplyStandard(type)`,
`onApplyClient(type)`; `StepMenu` recibe `templatesByType`, `selectedTemplates`,
`onSelectTemplate(type, tmpl)`; `useMacros` expone `breakfastMacros`/`updateBreakfastMacro` y
`getBaseMacros(cls)` (una clasificación combinada resuelve al tiempo principal).

## 6. Pruebas realizadas (Playwright contra staging `oasis-test`)

- Editar cliente y crearle perfil de desayuno.
- Pedido de un tiempo (Desayuno) y de 3 tiempos: `Breakfast+Lunch+Dinner`; cada receta con sus macros (3/2, 200/250, 150/200) y, en `Fase_2`, `meal_type` correcto por detalle.
- Edición de un pedido de 3 tiempos: paneles de los 3 tiempos, cambiar solo el desayuno no altera los otros.
- Express con Desayuno; detalle de cliente; portal (UI y RPC con `Breakfast+Lunch`, `Breakfast+Dinner`).
- No probado en el navegador contra producción, ni la exportación PDF de producción.

## 7. Hallazgos y limitaciones

- **Corregido de paso:** `AddOrder` guardaba siempre `macro_profile_snapshot_id = null` (la consulta de clientes no traía `*_macro_profile_id`); ahora se toma del perfil embebido.
- **Corregido de paso:** el dashboard ignoraba pedidos `both`; `OrderBlock` rotulaba `both` como "Familiar".
- **Limitación (main):** la inferencia del tiempo de cada receta al editar es ambigua si dos tiempos tienen macros idénticos; se resuelve al desplegar `Fase_2` (usa `meal_type`).
- **Observado, no tocado:** `EditOrder` borra y reinserta días/detalles y no recarga los overrides de ingredientes existentes.
- **Ambientes:** `main` apunta a producción; `Fase_2` a staging (`.env` versionado). Nunca mezclar.
