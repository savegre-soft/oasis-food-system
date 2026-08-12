# v2 — Requerimientos: Sitio público (marketing e información general)

> Módulo 2 de la Fase 3 del roadmap (`00_ROADMAP.md §5.4, §6`). Menor riesgo: no requiere el rediseño de RLS que sí necesita el portal de clientes — solo agrega inserción anónima acotada a un par de tablas nuevas.

---

## 1. Contexto

Auditoría del sitio público actual (`00_ROADMAP.md §5.4`): de las 6 páginas públicas, solo `Menu.jsx` está realmente conectada a datos reales. El resto es scaffolding sin terminar — promociones hardcodeadas, formulario de contacto que no persiste, un formulario de "Ordenar" que simula ser de un restaurante a la carta (no encaja con el modelo real de suscripción semanal), y una página About de 3 líneas.

**Principio acordado:** el sitio público es **marketing + captura de interesados**, no un canal de pedidos reales. Los pedidos reales (semana a semana, con macros y rutas) son exclusivos del portal de clientes ya dados de alta (`03_REQUERIMIENTOS_PORTAL_CLIENTE.md`).

## 2. Objetivo

Que cada página pública cumpla una función real y termine en una sola conversión clara: **que un interesado deje sus datos** para que el equipo lo contacte y, si corresponde, lo dé de alta como cliente (flujo manual existente, `AddCustomer.jsx`).

## 3. Por página

| Página | Cambio requerido |
|---|---|
| `/` (Home) | Reescribir el copy principal para reflejar el modelo real: meal-prep semanal por suscripción, con control de macros y entrega por rutas — no "restaurante de comida rápida". **Resuelto (2026-08-11): mensaje combinado, sin priorizar un ángulo sobre otro — salud/control de macros y conveniencia/practicidad por igual.** |
| `/menu` | Se mantiene funcional tal cual (ya lee de `recipes`). El botón "Ordenar" de cada plato deja de abrir el formulario de contacto roto y abre el formulario único de interesados (§3, fila "Ordenar"/CTA). |
| `/promociones` | Deja de estar hardcodeada: se lee de una tabla nueva (`promotions`) administrable desde el panel interno. **Resuelto (2026-08-11): cada promoción admite imagen** (ver RF-PUB-02 y dependencia de Supabase Storage en §5). |
| `/contacto` | El formulario debe persistir en una tabla nueva y quedar visible para el equipo (bandeja interna). |
| "Ordenar" / CTA (hoy `/ordenar`, y el botón repetido en Home/Promociones/Menú) | Deja de ser un formulario de pedido falso. Se convierte en un formulario de **captura de interesados** ("Quiero ser cliente"): nombre, teléfono, comentario/preferencia opcional. No pide dirección, método de pago ni total — eso es parte del alta real de cliente, no de este formulario. |
| `/about` | Contenido real de la empresa. *(Sigue pendiente — el usuario debe proveerlo, ver §7.)* |

## 4. Bandeja interna de interesados/contactos

**Resuelto (2026-08-11): "Prospectos" vive como sección de primer nivel en el navbar** (junto a "Órdenes"/"Combos"), no dentro de un dropdown existente — al ser un flujo de entrada de negocio nuevo, se prioriza visibilidad alta.

Las solicitudes de contacto y de interesados caen en una tabla común y necesitan esa pantalla interna nueva, donde el equipo pueda:
- Ver las solicitudes nuevas.
- Marcarlas como atendidas/descartadas.
- Desde ahí, crear el cliente real reutilizando el flujo existente de `AddCustomer.jsx` (sin automatizar la conversión — sigue siendo una decisión humana del equipo).

## 5. RF/RNF

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-PUB-01 | El copy de la página de inicio debe describir el modelo real del negocio (suscripción semanal, macros, rutas de entrega). | Alta |
| RF-PUB-02 | Las promociones deben leerse de una tabla en base de datos, con una pantalla interna simple de administración (crear/editar/desactivar), incluyendo carga de una imagen por promoción (Supabase Storage). | Media |
| RF-PUB-03 | El formulario de contacto debe guardar cada mensaje en base de datos. | Alta |
| RF-PUB-04 | Todo CTA de "Ordenar" en el sitio público debe abrir un único formulario de captura de interesados (nombre, teléfono, comentario opcional) — no debe simular un pedido real. | Alta |
| RF-PUB-05 | Debe existir una pantalla interna donde el equipo vea los contactos e interesados, y pueda marcarlos como atendidos/convertidos. | Alta |
| RF-PUB-06 | La página About debe mostrar contenido real de la empresa (a proveer por el usuario). | Baja |

| ID | Requerimiento no funcional | Prioridad |
|---|---|---|
| RNF-PUB-01 | Las tablas nuevas (`promotions`, contactos/interesados) deben permitir inserción anónima **solo** en los formularios públicos correspondientes, con políticas RLS de solo-inserción — sin lectura ni edición pública. Este es un patrón de RLS distinto y más estricto que el "RLS abierta" usado hoy en las tablas internas (ver `00_ROADMAP.md §4`). | Alta |
| RNF-PUB-02 | Los formularios públicos deben tener una protección básica antirrobot (ej. honeypot), sin depender de un servicio externo de CAPTCHA salvo que se decida lo contrario. | Media |
| RNF-PUB-03 | Las páginas nuevas/editadas deben mantener la paleta y componentes visuales ya usados en el sitio público (emerald/teal, `framer-motion`), para no introducir un segundo lenguaje visual antes de la limpieza de UX general (Fase 5 del roadmap). | Media |

## 6. Fuera de alcance (explícito)

- Cualquier pedido real o pago desde el sitio público — eso vive en el portal de clientes.
- Conversión automática de un interesado a cliente — sigue siendo una acción manual del equipo.

## 7. Preguntas abiertas / dependencias

1. **Contenido real de About**: historia, misión, equipo — el usuario debe proveerlo, no se va a inventar contenido institucional. *(Único punto que sigue abierto en este módulo — el resto se resolvió el 2026-08-11.)*

No bloquea seguir con otros módulos; se resuelve antes de pasar este módulo a implementación.
