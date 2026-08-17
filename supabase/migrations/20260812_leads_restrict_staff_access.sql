-- operations.leads quedó con SELECT/UPDATE/DELETE abierto a cualquier
-- authenticated (20260812_public_site_leads_promotions.sql) — es dato de
-- terceros (ni siquiera clientes todavía: nombre/teléfono/email/mensaje de
-- quien llenó el formulario público). Se restringe al mismo criterio que ya
-- usan las pantallas que gestionan la cartera de clientes (customers.jsx,
-- customer.jsx, Prospects.jsx: AuthRoles(['Administrador','Clientes'])),
-- mismo patrón que la restricción de finance_tables en 20260704_rls_policies.sql.
-- El INSERT anónimo (formularios públicos) no cambia.

DROP POLICY IF EXISTS leads_authenticated_all ON operations.leads;
CREATE POLICY leads_staff_all ON operations.leads
  FOR ALL TO authenticated
  USING (operations.user_has_role(ARRAY['Administrador', 'Clientes']))
  WITH CHECK (operations.user_has_role(ARRAY['Administrador', 'Clientes']));
