-- RLS was enabled on every table in `operations` (and `public`) with no
-- policies, so every query now returns zero rows. This migration restores
-- access with a hybrid model, based on how the app actually behaves today:
--
--   - Only ~6 pages are gated by role in the frontend (AuthRoles.jsx), and
--     even fewer tables are EXCLUSIVELY used by those pages. Everything
--     else (creating/editing orders, deliveries, menus, recipes, routes,
--     templates, client list) is reachable by ANY logged-in user today,
--     regardless of role — there is no "staff" vs "client" separation at
--     the data layer, only at the UI layer.
--   - The 'Clientes' role has no column linking a Supabase Auth user to a
--     specific `clients.id_client`, so per-row "a client only sees their
--     own data" isn't achievable yet — that would need a schema change
--     (e.g. clients.auth_user_id) which is out of scope here.
--
-- So: tables that are GENUINELY exclusive to Finanzas/Administrador pages
-- (expenses, payroll, user/role management) are locked down for real.
-- Every other operational table is opened to any authenticated user,
-- matching current behavior, so order-taking/deliveries/menus etc. keep
-- working for whoever uses them today.
--
-- Safe to re-run: policies are dropped and recreated; the helper function
-- uses CREATE OR REPLACE.

-- ── Helper: does the current auth user hold one of the given roles? ─────────
-- SECURITY DEFINER so it bypasses RLS internally when reading Roles/userRoles
-- — otherwise policies on those two tables would recurse into themselves.
CREATE OR REPLACE FUNCTION operations.user_has_role(role_names text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = operations, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM operations."userRoles" ur
    JOIN operations."Roles" r ON r.id = ur."rolId"
    WHERE ur."userId" = auth.uid()
      AND trim(r.name) = ANY (role_names)
  );
$$;

GRANT EXECUTE ON FUNCTION operations.user_has_role(text[]) TO authenticated;

-- ── Open tables: any authenticated user, full CRUD (matches current behavior) ──

DO $$
DECLARE
  t text;
  open_tables text[] := ARRAY[
    'clients', 'countries', 'provinces', 'cantons', 'districts', 'macro_profiles',
    'routes', 'route_delivery_days',
    'recipes', 'recipe_ingredients',
    'order_templates', 'order_template_days', 'order_template_details',
    'payments', 'payment_orders',
    'orders', 'order_days', 'order_day_details', 'order_day_recipe_overrides'
  ];
BEGIN
  FOREACH t IN ARRAY open_tables LOOP
    EXECUTE format('ALTER TABLE operations.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON operations.%I', t || '_authenticated_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON operations.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t || '_authenticated_all', t
    );
  END LOOP;
END $$;

-- `recipes` also needs to be readable by anonymous visitors for the public
-- /menu page (PublicLayout, no login).
ALTER TABLE operations.recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recipes_anon_select ON operations.recipes;
CREATE POLICY recipes_anon_select ON operations.recipes
  FOR SELECT TO anon USING (true);

-- ── Restricted tables: Finanzas or Administrador only ────────────────────────

DO $$
DECLARE
  t text;
  finance_tables text[] := ARRAY[
    'expenses', 'expense_categories', 'empCost', 'emp_cost_deductions'
  ];
BEGIN
  FOREACH t IN ARRAY finance_tables LOOP
    EXECUTE format('ALTER TABLE operations.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON operations.%I', t || '_finance_admin_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON operations.%I FOR ALL TO authenticated USING (operations.user_has_role(ARRAY[''Administrador'', ''Finanzas''])) WITH CHECK (operations.user_has_role(ARRAY[''Administrador'', ''Finanzas'']))',
      t || '_finance_admin_all', t
    );
  END LOOP;
END $$;

-- ── Roles / userRoles ─────────────────────────────────────────────────────────
-- Read: your own role assignment (needed by AuthRoles.jsx for every user on
-- every gated page) OR anything if you're an Administrador (needed by the
-- user-management screen). Write: Administrador only.

ALTER TABLE operations."Roles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS roles_select ON operations."Roles";
CREATE POLICY roles_select ON operations."Roles"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS roles_write_admin ON operations."Roles";
CREATE POLICY roles_write_admin ON operations."Roles"
  FOR INSERT TO authenticated WITH CHECK (operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS roles_update_admin ON operations."Roles";
CREATE POLICY roles_update_admin ON operations."Roles"
  FOR UPDATE TO authenticated USING (operations.user_has_role(ARRAY['Administrador']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS roles_delete_admin ON operations."Roles";
CREATE POLICY roles_delete_admin ON operations."Roles"
  FOR DELETE TO authenticated USING (operations.user_has_role(ARRAY['Administrador']));

ALTER TABLE operations."userRoles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_select ON operations."userRoles";
CREATE POLICY user_roles_select ON operations."userRoles"
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid() OR operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS user_roles_write_admin ON operations."userRoles";
CREATE POLICY user_roles_write_admin ON operations."userRoles"
  FOR INSERT TO authenticated WITH CHECK (operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS user_roles_update_admin ON operations."userRoles";
CREATE POLICY user_roles_update_admin ON operations."userRoles"
  FOR UPDATE TO authenticated USING (operations.user_has_role(ARRAY['Administrador']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS user_roles_delete_admin ON operations."userRoles";
CREATE POLICY user_roles_delete_admin ON operations."userRoles"
  FOR DELETE TO authenticated USING (operations.user_has_role(ARRAY['Administrador']));

-- ── operations.profiles (user management list) ───────────────────────────────
-- Distinct from public.profiles. Only touched by the admin "Usuarios" screen.

ALTER TABLE operations.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS operations_profiles_select ON operations.profiles;
CREATE POLICY operations_profiles_select ON operations.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS operations_profiles_write_admin ON operations.profiles;
CREATE POLICY operations_profiles_write_admin ON operations.profiles
  FOR INSERT TO authenticated WITH CHECK (operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS operations_profiles_update_admin ON operations.profiles;
CREATE POLICY operations_profiles_update_admin ON operations.profiles
  FOR UPDATE TO authenticated USING (operations.user_has_role(ARRAY['Administrador']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS operations_profiles_delete_admin ON operations.profiles;
CREATE POLICY operations_profiles_delete_admin ON operations.profiles
  FOR DELETE TO authenticated USING (operations.user_has_role(ARRAY['Administrador']));

-- ── public.profiles (Supabase Auth profile row, id = auth.uid()) ─────────────
-- Written by Register.jsx (self-signup) and AddUser.jsx (Administrador
-- creating another user's profile).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_profiles_select ON public.profiles;
CREATE POLICY public_profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS public_profiles_insert ON public.profiles;
CREATE POLICY public_profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR operations.user_has_role(ARRAY['Administrador']));
DROP POLICY IF EXISTS public_profiles_update ON public.profiles;
CREATE POLICY public_profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR operations.user_has_role(ARRAY['Administrador']))
  WITH CHECK (id = auth.uid() OR operations.user_has_role(ARRAY['Administrador']));
