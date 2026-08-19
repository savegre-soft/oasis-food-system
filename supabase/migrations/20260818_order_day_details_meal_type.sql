-- Corrige un bug real: pedidos 'both' (Almuerzo + Cena) insertan 2 filas en
-- order_day_details (una por receta) pero nunca guardaban cuál era de
-- almuerzo y cuál de cena. Producción (Kitchen.jsx/Package.jsx) solo tenía
-- operations.orders.classification (a nivel de TODA la orden, valor literal
-- 'both'), así que ambos platos del mismo cliente/día se mostraban como si
-- fueran del mismo tiempo de comida (el binario `=== 'Lunch' ? ... : Cena`
-- de RecipeProductionCard.jsx hacía caer ambos a "Cena").
--
-- Nullable, sin backfill: filas históricas quedan NULL — el código de
-- lectura hace `detail.meal_type ?? orderDay.orders.classification`, que
-- preserva el comportamiento actual para datos viejos y para pedidos que no
-- son 'both' (donde classification ya es inequívoco).
--
-- Mismo estilo que 20260607_detail_status.sql, que agregó `status` a esta
-- misma tabla por una razón casi idéntica (pedidos 'ambos' necesitan
-- diferenciarse por detail, no por order_day completo).

ALTER TABLE operations.order_day_details
  ADD COLUMN IF NOT EXISTS meal_type text
    CHECK (meal_type IN ('Lunch', 'Dinner') OR meal_type IS NULL);
