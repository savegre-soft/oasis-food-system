-- Diagnóstico: Verificar que las rutas tengan route_delivery_days correctas
SELECT 
  r.id_route,
  r.name,
  r.route_type,
  COUNT(rdd.day_of_week) as delivery_days_count,
  STRING_AGG(rdd.day_of_week, ', ' ORDER BY rdd.day_of_week) as delivery_days
FROM operations.routes r
LEFT JOIN operations.route_delivery_days rdd ON r.id_route = rdd.route_id
WHERE r.is_active = true
GROUP BY r.id_route, r.name, r.route_type
ORDER BY r.name;
