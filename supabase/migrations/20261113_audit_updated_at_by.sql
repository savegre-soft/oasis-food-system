-- Añade updated_at / updated_by + trigger automático a las tablas de negocio mutables
-- de operations. Quedan fuera los catálogos geográficos/de roles (countries, provinces,
-- cantons, districts, route_delivery_days, "Roles", "userRoles") y las tablas append-only
-- (audit_logs, bulk_dish_price_history, combo_item_price_history, notifications,
-- notification_reads), que no se editan después de creadas.

create or replace function operations.set_updated_at_and_by()
returns trigger
language plpgsql
security definer
set search_path = operations, public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'bulk_dishes',
    'bulk_sale_batches',
    'bulk_sale_entries',
    'clients',
    'combo_items',
    'combo_order_selections',
    'combo_orders',
    'combo_week_categories',
    'combo_week_category_items',
    'combo_weeks',
    'empCost',
    'emp_cost_deductions',
    'event_quotes',
    'expense_categories',
    'expenses',
    'label_templates',
    'leads',
    'macro_profiles',
    'order_day_details',
    'order_day_recipe_overrides',
    'order_days',
    'order_template_days',
    'order_template_details',
    'order_templates',
    'order_week_checklist',
    'orders',
    'payment_orders',
    'payments',
    'portal_settings',
    'portal_template_overrides',
    'profiles',
    'promotion_requests',
    'promotions',
    'recipe_ingredients',
    'recipes',
    'routes',
    'users'
  ];
begin
  foreach t in array tables loop
    execute format(
      'alter table operations.%I add column if not exists updated_at timestamptz;',
      t
    );
    execute format(
      'alter table operations.%I add column if not exists updated_by uuid references operations.profiles(id);',
      t
    );
    execute format(
      'drop trigger if exists trg_set_updated_at_by on operations.%I;',
      t
    );
    execute format(
      'create trigger trg_set_updated_at_by before update on operations.%I
         for each row execute function operations.set_updated_at_and_by();',
      t
    );
  end loop;
end;
$$;
