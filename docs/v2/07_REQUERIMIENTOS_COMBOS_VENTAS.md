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

## 6. Pendientes / dependencias

- Ninguno de los ítems de este documento bloquea otro módulo del roadmap.
- La migración `20260812_promotions_source_link.sql` ya fue aplicada por el usuario.
- El próximo documento de diseño técnico previsto en el roadmap (rediseño de RLS/permisos, Etapa 2 de `06_PLAN_IMPLEMENTACION.md`) se numerará `08_DISEÑO_RLS.md` para no chocar con este archivo.
