-- Permite exceder el máximo de selecciones de una categoría del combo: la
-- unidad que excede el tope se sigue agregando al pedido, pero marcada como
-- "extra" con un cobro adicional que el administrador ingresa al momento de
-- elegirla (ver AddComboOrder.jsx / EditComboOrder.jsx / useComboSelections).
ALTER TABLE operations.combo_order_selections
  ADD COLUMN IF NOT EXISTS is_extra boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS extra_charge numeric;
