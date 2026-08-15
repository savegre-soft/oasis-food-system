-- Las funciones del portal solo tenían GRANT EXECUTE para `anon`. Un cliente
-- real nunca tiene sesión, así que en producción esto nunca sería un
-- problema — pero el staff, al probar el portal desde el mismo navegador
-- donde tiene sesión iniciada, hace la llamada como `authenticated` (el
-- cliente supabase-js adjunta el JWT de sesión automáticamente a cualquier
-- request, incluidas estas RPC), y esa llamada quedaba rechazada con 403.
-- Otorgar EXECUTE también a `authenticated` no cambia el modelo de
-- seguridad: la función sigue resolviendo únicamente por token, nunca
-- expone más de un cliente, y el staff ya tiene acceso completo a los
-- datos de cualquier cliente por las tablas directamente.
GRANT EXECUTE ON FUNCTION operations.portal_get_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION operations.portal_get_current_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION operations.portal_get_menu_options(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION operations.portal_submit_order(uuid, jsonb) TO authenticated;
