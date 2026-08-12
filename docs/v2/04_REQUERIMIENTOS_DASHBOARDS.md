# v2 — Requerimientos: Dashboards

> Fase 5 del roadmap (`00_ROADMAP.md §5.3, §6`), iterativo — no depende de las fases 2-4, salvo el punto de adopción del portal (RF-DASH-03).

---

## 1. Contexto

Hoy `Main.jsx` (`/main`) ya cubre: conteo de clientes, entregas por período, % activos/express, y gráficos de recetas/clasificación/tipo de orden/distrito, usando `recharts` con paleta centralizada en `chartUtils.jsx`. Es un dashboard **descriptivo** (qué pasó). Lo que falta, a partir de conversaciones con el usuario y de brechas identificadas en el mapa del sistema, es visibilidad **operativa en el momento** (qué falta hacer hoy) y de **seguimiento de cobros**.

## 2. Objetivo

Agregar 3 vistas puntuales que hoy el equipo resuelve navegando manualmente entre pantallas o a ojo, sin introducir una librería de gráficos nueva ni un dashboard paralelo al ya existente.

## 3. Vistas propuestas

### 3.1 Panel operativo de producción (tiempo real)

Cuánto falta por cocinar/empacar/entregar del lote activo (hoy para Express, semana para producción regular), sin tener que navegar entre las pestañas Cocina→Empaque→Entrega para armar el conteo a ojo. Fuente: conteos por `status` sobre `order_day_details` del lote visible — el mismo dato que ya consumen `Kitchen.jsx`/`Package.jsx`/`Delivered.jsx`, solo agregado.

### 3.2 Salud de cobros

Pagos mensuales (`payment_type='monthly'`) próximos a vencer o con cupos sin usar — construye sobre la función de cierre manual de pago ya existente (`closed_at`, `Payments.jsx`). Muestra qué pagos están cerca del fin de su período sin las 4 órdenes usadas, para que el equipo decida si cerrarlos o darles seguimiento antes de que venza el período.

### 3.3 Adopción del portal de clientes

% de pedidos originados en el portal vs. creados por el equipo, en el tiempo. **Depende de que exista `created_via`/origen en `orders`** (RF-PC-07 del módulo de portal) — no se puede construir antes de que el portal esté implementado. Sirve para medir si el portal realmente reduce la carga manual del equipo, que es el objetivo de negocio detrás de construirlo.

## 4. RF/RNF

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-DASH-01 | Debe existir un panel con el conteo en tiempo real de platos pendientes/empacados/entregados del lote de producción activo, dentro de la pantalla de Entregas. | Alta |
| RF-DASH-02 | Debe existir una vista de pagos mensuales que marque como "próximo a vencer" los que estén a 3 días o menos del fin de su período sin las 4 órdenes usadas. | Media |
| RF-DASH-03 | Debe existir una métrica de % de pedidos originados en el portal vs. creados por el equipo. | Media — bloqueada hasta que exista el portal |
| RF-DASH-04 | Los dashboards nuevos deben usar `recharts` y la paleta centralizada de `chartUtils.jsx` — no se introduce una librería de visualización nueva. | Alta |

| ID | Requerimiento no funcional | Prioridad |
|---|---|---|
| RNF-DASH-01 | El panel operativo (§3.1) debe actualizarse mediante refresco periódico simple (cada 30-60s) — no requiere Supabase Realtime. | Alta |
| RNF-DASH-02 | Ninguna de estas vistas requiere tablas nuevas, salvo la columna de origen que ya pide el módulo de portal (RF-PC-07). | — |

## 5. Decisiones (resueltas 2026-08-11)

1. **"Próximo a vencer"** (§3.2): 3 días antes del fin del período. Ver RF-DASH-02.
2. **Mecanismo de actualización del panel operativo** (§3.1): refresco periódico simple cada 30-60s, sin Supabase Realtime. Ver RNF-DASH-01.
3. **Ubicación**: dentro de la pantalla de Entregas, donde ya está el equipo trabajando durante el día — no en el dashboard principal. Ver RF-DASH-01.

No quedan preguntas abiertas en este módulo.
