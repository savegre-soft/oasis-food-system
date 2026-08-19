# Oasis Food System — Guía de referencia para Claude

## Stack técnico
- **React 19** + **Vite** — SPA, sin SSR
- **Tailwind CSS v4** — dark mode con prefijo `dark:` (clase en `<html>`)
- **Supabase** — base de datos + autenticación. Cliente en `src/lib/supabase.js`. Todas las tablas viven en el schema `operations` → siempre usar `.schema('operations').from('...')`
- **React Router v7** — rutas en `src/App.jsx`
- **Lucide React** — íconos
- **Recharts** — gráficas en estadísticas
- **Leaflet / React Leaflet** — mapas de rutas

---

## Rutas de la aplicación (`src/App.jsx`)

### Privadas (requieren auth, dentro de `MainLayout`)
| Ruta | Página | Descripción |
|---|---|---|
| `/main` | `Main.jsx` | Dashboard principal |
| `/Clientes` | `customers.jsx` | Lista de clientes |
| `/cliente/:id` | `customer.jsx` | Detalle de cliente |
| `/orders` | `Orders.jsx` | Gestión de pedidos (histórico + checklist de envío) |
| `/entregas` | `Deliveries.jsx` | Flujo cocina → empaque → entrega (pedidos semanales) |
| `/entregas/express` | `DeliveriesExpress.jsx` | Mismo flujo cocina → empaque → entrega, pedidos Express del día |
| `/entregas/combos` | `DeliveriesCombos.jsx` | Producción y entrega de Combos (organizado por `combo_week`, sin fecha individual) |
| `/menus` | `Menus.jsx` | Catálogo de platos/recetas (la página se llama "Platos" en el navbar) |
| `/templates` | `Templates.jsx` | Plantillas de pedidos semanales |
| `/routes` | `Routes_page` (`Routes.jsx`) | Rutas de entrega |
| `/pagos` | `Payments.jsx` | Pagos de clientes (Ingresos) |
| `/gastos` | `Bills.jsx` | Gastos operativos |
| `/empleados` | — | Redirige a `/planilla` |
| `/planilla` | `Planilla.jsx` | Costos por empleado |
| `/control-gastos` | `ExpenseStadistic.jsx` | Estadísticas de gastos |
| `/estadisticas` | `Estadisticas.jsx` | Dashboard estadístico (gastos, ingresos, comparativa, planilla, combos/ventas masivas) |
| `/combos` | `Combos.jsx` | Configuración semanal de Combos |
| `/combo-items` | `ComboItems.jsx` | Catálogo de ítems de Combo (con precio + historial) |
| `/ventas-masivas` | `BulkSales.jsx` | Ventas masivas |
| `/platos-venta-masiva` | `BulkDishes.jsx` | Catálogo de platos de venta masiva |
| `/prospectos` | `Prospects.jsx` | Bandeja de leads del sitio público, conversión a cliente real |
| `/promociones-admin` | `PromotionsAdmin.jsx` | Administración de promociones (versión interna de `/promociones`) |
| `/settings` | `Settings.jsx` | Configuración (incl. Usuarios y roles) |
| `/perfil` | `Profile.jsx` | Perfil de usuario |
| `/about` | `About.jsx` | Placeholder interno, no confundir con el "About" del sitio público |

> Nota: no existe ninguna ruta `/Pedidos` ni `/recetas` — son documentación heredada de una versión anterior del código (`Test.jsx` ya no existe). El wizard de creación de pedidos (`AddOrder.jsx`) se abre como modal desde `/orders`, no tiene ruta propia.

### Públicas (dentro de `PublicLayout`)
| Ruta | Descripción |
|---|---|
| `/` | Home público |
| `/menu` | Menú público |
| `/contacto` | Formulario de contacto |
| `/promociones` | Página de promociones |
| `/ordenar` | Orden pública de cliente |

---

## Módulo de Entregas (`src/pages/Deliveries.jsx`, `DeliveriesExpress.jsx`, `DeliveriesCombos.jsx`)

El flujo cocina → empaque → entrega vive en 3 rutas separadas (antes eran tabs dentro de una sola página) que comparten el mismo pipeline de 3 tabs vía `KitchenPipeline.jsx`:

- **`/entregas`** (`Deliveries.jsx`) — pedidos semanales normales
- **`/entregas/express`** (`DeliveriesExpress.jsx`) — pedidos Express del día
- **`/entregas/combos`** (`DeliveriesCombos.jsx`) — producción de Combos, organizada por `combo_week` (sin fecha de entrega individual, ver §Combos)

### Tabs del pipeline (`KitchenPipeline.jsx`)
1. **Cocina** (`cocina`) → `CocinaView` (desde `Kitchen.jsx`) — pedidos PENDING agrupados por receta
2. **Empaque** (`empaque`) → `EmpaqueView` (desde `Package.jsx`) — pedidos PENDING y PACKED agrupados por receta
3. **Entrega** (`entrega`) → `EntregaView` (desde `Delivered.jsx`) — pedidos DELIVERED, solo lectura, agrupados por cliente

### Ciclo de estados de `order_days.status`
```
PENDING → (Cocinar) → PENDING → (Empacar) → PACKED → (Entregar) → DELIVERED
```
- `markPacked(id)` → actualiza a `'PACKED'`
- `markDelivered(id)` → actualiza a `'DELIVERED'`

### Datos cargados en Deliveries
- `pendingDays` — `order_days` con status PENDING del slot/semana seleccionado
- `packedDays` — `order_days` con status PACKED
- `deliveredDays` — `order_days` con status DELIVERED
- `allRoutes` — todas las rutas para el selector de semana/slot

---

## Flujo de creación de pedidos (`src/components/AddOrder.jsx`)

Wizard de **4 pasos** (o 2 si es express):

| Paso | Componente | Descripción |
|---|---|---|
| 1 | `StepClient.jsx` | Selección de cliente |
| 2 | `StepMenu.jsx` | Tipo de menú (Lunch/Dinner/both/Family) o toggle Express |
| 2 (express) | `StepExpressRecipes.jsx` | Recetas + macros para pedido express del día |
| 3 | `OrderAdjustments.jsx` | Ruta + macros base + recetas por día de la semana |
| 4 | `StepPayment.jsx` | Método de pago + estado de pago |
| 4 | `StepConfirm.jsx` | Resumen y confirmación |

**Tipos de cliente:**
- `'personal'` — tiene macros de almuerzo y cena, menuType puede ser `'Lunch'`, `'Dinner'` o `'both'`
- `'family'` — sin macros individuales, menuType es `'Family'`, entrega siempre viernes

**Pedido Express (`isExpress = true`):**
- Solo pasos 1 y 2 (no hay step 3 ni step 4 completo)
- Receta única para hoy, sin desglose semanal
- Lleva su propio `expressType` (`'Lunch'` | `'Dinner'`), `expressMacros`, `expressRecipes`

---

## Componentes clave de pedidos

| Archivo | Rol |
|---|---|
| `OrderAdjustments.jsx` | Contenedor del paso 3: ruta + macros base + DayRecipeBlock por día |
| `DayRecipeBlock.jsx` | Bloque colapsable por día: lista de recetas + override de macros del día |
| `MacroPanel.jsx` | Input de macros (proteína + carbo). `colorClass`: `'amber'` (almuerzo) o `'indigo'` (cena) |
| `RecipeIngredientEditor.jsx` | Editor de ingredientes por receta (override de la composición base) |
| `RouteSelector.jsx` | Selector/visor de ruta con días de entrega |
| `orderUtils.js` | Constantes y helpers compartidos (ver abajo) |
| `useMacros.js` | Hook: estado de macros base + overrides por día |
| `useDayRecipes.js` | Hook: estado de recetas por día de la semana |

---

## Componentes de cocina/empaque/entrega

| Archivo | Rol |
|---|---|
| `Kitchen.jsx` + `CocinaView` | Vista de cocina agrupada por receta; exporta `groupByRecipe()` |
| `Package.jsx` + `EmpaqueView` | Vista de empaque por receta; botón "Empacar" empaca todos los PENDING de esa receta en bloque |
| `Delivered.jsx` | Vista de entregados solo lectura agrupada por cliente |
| `RecipeProductionCard.jsx` | Tarjeta de receta en cocina (expandible con detalle de clientes) |
| `ProductionPrintReport.jsx` | Modal de resumen de producción + exportación PDF/impresión |
| `ClientDeliveryCard.jsx` | Tarjeta de cliente en la vista de entrega |

### Lógica de agrupación por receta (`groupByRecipe` en Kitchen.jsx)
Clave única: `recipeId__fingerprint` donde el fingerprint es la composición ordenada de ingredientes. Permite que la misma receta con ingredientes distintos (override) aparezca como variante separada.

---

## Tablas Supabase (schema `operations`)

| Tabla | Descripción |
|---|---|
| `clients` | Clientes. Campos clave: `id_client`, `name`, `client_type` (`'personal'`/`'family'`), `lunch_macro`, `dinner_macro` |
| `macro_profiles` | Perfiles de macros (`protein_value`, `carb_value`). Unidad: `'ud.'` (definida en `MACRO_UNIT`) |
| `orders` | Pedido principal. Tiene `classification` (`'Lunch'`/`'Dinner'`) y FK a cliente y ruta |
| `order_days` | Un día de pedido. Campos: `id_order_day`, `status` (`PENDING`/`PACKED`/`DELIVERED`), `day_of_week`, FK a `orders` |
| `order_day_details` | Detalle de receta en un `order_day`: `recipe_id`, `quantity`, `protein_value_applied`, `carb_value_applied` |
| `order_day_recipe_overrides` | Override de ingredientes para una receta en un día específico: `category` (`protein`/`carb`/`extra`), `name` |
| `recipes` | Recetas. `id_recipe`, `name` |
| `recipe_ingredients` | Ingredientes base de una receta: `category`, `name` |
| `routes` | Rutas de entrega |
| `route_delivery_days` | Días de entrega de una ruta: `day_of_week` |
| `order_templates` | Plantillas de pedido reutilizables |
| `order_template_days` / `order_template_details` | Detalle de plantillas |
| `expenses` / `expense_categories` | Gastos operativos |
| `payments` / `Payments` / `PaymentsType` / `payment_orders` | Módulo de pagos |
| `empCost` | Costos por empleado |
| `profiles` / `userRoles` / `Roles` | Auth y roles de usuario |
| `countries` / `provinces` / `cantons` / `districts` | Ubicación geográfica de clientes |

---

## Constantes y utilities (`src/components/orderUtils.js`)

```js
MACRO_UNIT = 'ud.'
DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
DAY_LABELS = { Monday: 'Lunes', ... }
DAY_SHORT   = { Monday: 'Lun', ... }
isFamily(client)            // client.client_type === 'family'
getWeekRange()              // devuelve { start, end, label } de la semana actual
getAbsoluteDate(day, weekStart)
getDateForDay(day, weekStart, routeDeliveryDays)
```

Hay también `src/utils/DAY_LABELS.js` y `src/utils/DAY_ORDER.js` como duplicados de utilidad independientes.

---

## Convenciones de dark mode (Tailwind)

Patrón estándar para inputs:
```
bg-white dark:bg-slate-900
border-slate-200 dark:border-slate-700
text-slate-800 dark:text-slate-200
placeholder:text-slate-400 dark:placeholder:text-slate-600
focus:ring-slate-800 dark:focus:ring-indigo-600
```

Contenedores coloreados (amber = almuerzo, indigo = cena):
```
bg-amber-50 dark:bg-amber-900/20
border-amber-200 dark:border-amber-800/50
text-amber-700 dark:text-amber-400
```

---

## Exportación PDF (`ProductionPrintReport.jsx`)

Approach correcto (no usar `visibility:hidden` — causa superposición en páginas 2+):
```css
@media print {
  body > *:not(#oasis-print-report) { display: none !important; }
  #oasis-print-report { display: block !important; width: 100%; }
}
```
El HTML del reporte se inyecta como string en un `<div id="oasis-print-report">` adjunto al `document.body`.

---

## Estructura de carpetas

```
src/
├── App.jsx                  # Definición de rutas
├── main.jsx                 # Entry point
├── lib/supabase.js          # Cliente Supabase
├── context/AppContext.jsx   # Contexto global de auth/usuario
├── layout/
│   ├── MainLayout.jsx       # Layout autenticado (NavBar + Outlet)
│   └── PublicLayout.jsx     # Layout público
├── pages/                   # Una página por ruta
├── components/              # Componentes reutilizables
│   ├── orders/steps/        # Pasos del wizard de creación de pedidos
│   ├── orders/              # Secciones y bloques de órdenes
│   ├── payment/             # Componentes de pagos
│   ├── stats/               # Paneles de estadísticas
│   ├── customer/            # Componentes de cliente
│   ├── macro/               # MacroPanel (versión alternativa)
│   ├── History/             # Vista de historial
│   └── auth/                # AuthRoles
├── hooks/                   # Custom hooks (customers, payments, dashboard)
└── utils/                   # DAY_LABELS, DAY_ORDER, chartUtils, customerUtils
```

> Nota: existen duplicados legacy en `src/components/` de archivos que tienen versión más reciente en subcarpetas (`OrdersSection`, `HistoryView`, `MacroPanel`). Preferir la versión en subcarpeta si existe.
