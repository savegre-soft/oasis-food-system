# Oasis Food System v2 — Visión y Hoja de Ruta

> **Estado:** Borrador para revisión — etapa 1 de N (ver §7 "Próximos pasos").
> **No reemplaza** `docs/MAPA_DEL_SISTEMA.md` ni `docs/Requerimientos_Oasis.xlsx`, que documentan el estado **actual** (v1) del sistema. Este documento es la línea base sobre la que se construye v2.

---

## 1. Propósito

Este documento fija el alcance y la dirección de la v2 de Oasis Food System antes de entrar en requerimientos detallados módulo por módulo. Cubre:

- Qué motiva la v2 y qué gana el negocio con ella.
- Una recomendación de arquitectura (el usuario dejó abierta la puerta a una reescritura mayor; aquí se plantea con honestidad qué conviene reescribir y qué conviene conservar).
- El mapa de módulos nuevos y mejorados, con las decisiones ya tomadas y las que quedan abiertas.
- Las fases propuestas y qué se entrega en cada una.

Una vez validado esto, se redactan requerimientos funcionales/no funcionales detallados (RF/RNF v2) por módulo, siguiendo el mismo formato que `Requerimientos_Oasis.xlsx` pero en `docs/v2/`.

---

## 2. Contexto — dónde está parado v1 hoy

Resumen (detalle completo en `docs/MAPA_DEL_SISTEMA.md`):

- **Stack:** React 19 + Vite + Tailwind 4, Supabase (Postgres + Auth + RLS) como backend, sin servidor propio.
- **10 módulos funcionales** operando: Clientes, Pedidos, Recetas/Producción, Menús/Plantillas, Rutas, Pagos, Gastos/Planilla, Estadísticas, Auth/Usuarios, Público.
- **Todo el flujo es interno**: hoy únicamente el equipo de Oasis crea pedidos, registra pagos y gestiona producción. No hay ninguna superficie de cara al cliente más allá de páginas públicas informativas.
- **RLS abierta** en casi todas las tablas de negocio (cualquier usuario autenticado tiene CRUD completo) — funciona porque todos los usuarios actuales son internos y de confianza. Esto **deja de ser válido** en cuanto exista un portal de clientes (ver §5.3).
- 56 RF y 25 RNF documentados, con ~17 hallazgos de deuda técnica ya catalogados (código muerto, duplicaciones, bugs menores) — nada bloqueante, pero es limpieza pendiente.

---

## 3. Visión de v2

Tres frentes, en orden de impacto en el negocio:

1. **Cara al cliente**: el cliente deja de depender 100% del equipo para hacer/editar su pedido semanal — puede hacerlo él mismo desde un enlace propio, sin pasarela de pago (el cobro sigue siendo manual/fuera de línea, como hoy).
2. **Cara a producción**: reducir trabajo manual y errores en piso de cocina/empaque — empezando por la impresión automática de etiquetas de entrega.
3. **Cara a gestión**: dashboards que respondan mejor las preguntas que hoy el equipo resuelve a ojo o exportando datos, y una limpieza visual/UX consistente en todo el sistema.

---

## 4. Arquitectura — recomendación

Se dejó abierta la opción de una reescritura mayor. Mi recomendación, con honestidad:

**Reescribir el frontend, conservar Supabase como backend.**

| Elemento | Recomendación | Por qué |
|---|---|---|
| Base de datos (Postgres/Supabase) | **Conservar el esquema como base**, extenderlo | El modelo de datos actual (clientes, macros, pedidos, rutas, combos) es sólido y ya validado con datos reales; no es la fuente de los problemas que motivan v2. Reescribirlo desde cero implica migrar datos de producción reales sin necesidad. |
| Autenticación/hosting (Supabase Auth + Postgres) | **Conservar** | Cambiar de backend-as-a-service a servidor propio es un proyecto en sí mismo (meses), con riesgo alto y sin relación directa con "portal de cliente" o "etiquetas". Si más adelante el volumen o RLS lo justifican, se evalúa aparte. |
| RLS y modelo de permisos | **Reescribir** | Aquí sí hay una razón concreta: RLS abierta funciona con usuarios 100% internos, pero deja de ser segura en cuanto un cliente externo tenga cualquier acceso (aunque sea vía enlace, no login). Es la pieza de arquitectura con más riesgo si se hace mal. |
| Frontend (React/Vite/Tailwind) | **Reescribir de forma modular**, no big-bang | El stack en sí (React 19, Tailwind 4, Vite) es moderno y no hay motivo técnico para cambiarlo. "Reescribir" aquí significa: nuevas pantallas para v2 se construyen con estándares más estrictos desde el día 1 (estado de dominio centralizado en vez de disperso en hooks por feature, componentes compartidos consistentes, sistema de diseño único) en vez de heredar los patrones ad-hoc de v1. Las pantallas internas existentes se migran gradualmente al nuevo estándar, no todas de golpe. |

**En corto:** la "reescritura mayor" se concentra donde realmente hay deuda y riesgo (permisos/seguridad, consistencia de frontend), no en tirar y rehacer lo que ya funciona (esquema de datos, backend). Si preferís ir más a fondo (ej. salir de Supabase, cambiar de framework), decímelo explícitamente porque cambia el roadmap de forma importante — no lo asumo por defecto.

---

## 5. Módulos nuevos y mejorados

### 5.1 Impresión de etiquetas de producción

Ya cubierto en la consulta anterior. Resumen de la decisión pendiente: etiquetas para cortadora digital (archivo vectorial SVG/PDF con capa de corte) vs. hoja impresa con guías de corte manual (CSS de impresión, extensión de `ProductionPrintReport.jsx`). **Esto se detalla en el documento de requerimientos del módulo, no aquí.**

### 5.2 Portal de pedidos para clientes (sin pasarela de pago)

**Decisión tomada** (quedó a mi criterio): acceso por **enlace único por cliente** — cada `client` tiene un token propio (ligado a `id_client`), sin usuario/contraseña tradicional. Justificación:
- Base de clientes reducida y conocida (no es un e-commerce abierto al público) — no se necesita registro público.
- Evita construir infraestructura de cuentas de cliente (recuperación de contraseña, verificación de email, etc.) para un caso de uso que no lo requiere.
- El enlace se puede compartir por WhatsApp (canal que ya usan hoy, según el flujo de negocio descrito en el mapa del sistema), reduciendo fricción de adopción.
- Es reversible: si más adelante hace falta más seguridad (ej. verificación por SMS antes de confirmar un pedido), se agrega sin rehacer el modelo.

Qué necesita el portal, a alto nivel (se detalla en RF v2):
- Vista del cliente de su plan actual (macros, tipo de cliente personal/family, ruta asignada).
- Selección de recetas/menú semanal dentro de las reglas ya existentes (plantillas, macros, resolución de fecha de entrega) — **reutiliza** la lógica de `orderUtils.js`, no la duplica.
- Confirmación de pedido que cae en el mismo flujo de `orders`/`order_day_details` que ya existe, en estado `PENDING`, para que el equipo interno lo vea igual que uno creado manualmente hoy.
- Sin cobro en línea: el pedido queda pendiente de pago igual que si lo hubiera creado el equipo; el registro de pago lo sigue haciendo el staff.
- Fuera de alcance explícito de este portal (a menos que se pida): historial de pagos del cliente, edición de datos de contacto, soporte/chat.

**Riesgo de seguridad a resolver en el diseño técnico**: un token por cliente debe ser no-adivinable (UUID/random, no `id_client` secuencial expuesto) y con alcance limitado por RLS a los datos de ese cliente únicamente — este es el punto donde la RLS abierta actual **debe** cambiar (ver §4).

### 5.3 Dashboards — mejoras recomendadas

A partir de lo que ya existe en `Main.jsx` (conteo de clientes, entregas por período, % activos/express, gráficos de recetas/clasificación/distrito), recomiendo evaluar:
- **Vista operativa del día/semana** para producción: cuánto falta por cocinar/empacar/entregar en tiempo real (hoy se infiere navegando Cocina→Empaque→Entrega).
- **Salud de cobros**: pagos mensuales próximos a vencer o con cupos sin usar (relacionado con el cierre manual de pagos ya implementado).
- **Uso del portal de clientes** una vez exista: cuántos clientes usan el enlace vs. cuántos siguen dependiendo del equipo — sirve para medir adopción de la v2.
- Mantener el patrón visual actual (recharts + paleta centralizada en `chartUtils.jsx`) en vez de introducir una librería nueva.

### 5.4 Sitio público (marketing e información general)

Revisé las 5 rutas públicas actuales (`PublicLayout` → `Homes.jsx`, `Menu.jsx`, `Promotions.jsx`, `contact.jsx`, `Order.jsx`, más `About.jsx`). Hallazgo principal: **es mayormente scaffolding sin terminar**, no un sitio con contenido real:

| Página | Estado real | Problema |
|---|---|---|
| `/` (`Homes.jsx`) | Landing genérica funcional (hero, features, CTA) | El copy describe un restaurante de comida rápida ("preparamos y enviamos tu pedido en tiempo récord"), no el negocio real: **meal-prep semanal por suscripción con macros y rutas de entrega**. No transmite la propuesta de valor real. |
| `/menu` (`Menu.jsx`) | **Sí conectado a datos reales** (`recipes` de Supabase, paginado, buscable) | El botón "Ordenar" abre un modal que reutiliza `contact.jsx` — un formulario de contacto, no un pedido. |
| `/promociones` (`Promotions.jsx`) | 3 promos **hardcodeadas en el componente**, sin BD | No reflejan promociones reales ni se pueden actualizar sin tocar código. |
| `/contacto` (`contact.jsx`) | Formulario que **no persiste nada** | Se renderiza sin ninguna prop (`<Route path="/contacto" element={<Contact />} />`, `App.jsx:72`) — no tiene título, y `onSubmit` nunca se pasa, así que el submit no hace literalmente nada. Ya existía un intento previo (`ContactRequest.jsx`/`ContactCard.jsx`) que se eliminó como código muerto en la limpieza de v1. |
| `/ordenar` (`Order.jsx`) | **Formulario dummy de restaurante genérico** (cliente, dirección, método de pago, total) con solo `alert()` | No tiene relación con el modelo de negocio real (planes semanales, macros, rutas) — es claramente un placeholder que nunca se conectó. |
| `/about` (`About.jsx`) | Placeholder de 3 líneas ("Hola, soy Daniel") | Sin contenido real. |

**Recomendación — separar dos cosas que hoy están mezcladas bajo "ordenar":**

1. **Sitio público (marketing, sin login)**: Home con mensaje ajustado al negocio real, Menú (ya funcional, se conserva), Promociones con datos reales en BD (tabla nueva simple, editable desde el panel interno), Contacto que sí persista (tabla `contact_requests` o similar + notificación al equipo), y About con contenido real de la empresa.
2. **"Ordenar" para público general deja de ser un formulario de pedido fantasma** y se convierte en una **captura de interesados** ("Quiero ser cliente" / lead): nombre, teléfono, alguna preferencia opcional. Esto entra a una bandeja interna (nueva, sencilla) para que el equipo lo convierta en cliente real — que es como ya funciona hoy el alta manual de clientes. Una vez es cliente, recibe su enlace del **portal de pedidos** (§5.2), que es donde sí pasa pedidos reales cada semana. No tiene sentido duplicar lógica de pedidos reales (macros, plantillas, rutas) en una página pública anónima — el portal ya cubre eso para clientes existentes.

Esto es un cambio de alcance respecto a lo que sugería el nombre "Ordenar" hoy, pero es coherente con que Oasis es un negocio de suscripción, no un restaurante a la carta.

### 5.5 Cambios visuales / UX

Antes de listar cambios puntuales, propongo una auditoría corta (visual, con Playwright) de las pantallas internas actuales para identificar inconsistencias reales en vez de rediseñar a ciegas. Se documenta como tarea en la fase 1 del roadmap (§6).

---

## 6. Fases propuestas

| Fase | Contenido | Objetivo |
|---|---|---|
| **0 — Este documento** | Alcance y arquitectura acordados | Evitar retrabajo |
| **1 — Requerimientos detallados** | RF/RNF v2 por módulo (etiquetas, portal, dashboards, visual), en `docs/v2/`, mismo formato que el Excel v1 | Base para estimar y priorizar |
| **2 — Base de seguridad** | Rediseño de RLS/permisos antes de exponer nada a clientes externos | Es prerrequisito técnico del portal, no puede ir después |
| **3 — Etiquetas + sitio público** | Módulos acotados y de menor riesgo (sin tocar RLS/seguridad de clientes), buen primer paquete de entregables de v2 | Valor rápido y visible, valida el patrón de trabajo |
| **4 — Portal de clientes** | El módulo de mayor impacto y mayor superficie nueva | Depende de fase 2 |
| **5 — Dashboards + visual** | Iterativo, en paralelo a las anteriores | Mejora continua |

---

## 7. Próximos pasos

1. Validar este documento contigo (arquitectura, decisión de acceso del portal, fases).
2. Con eso aprobado, redactar los documentos de requerimientos detallados (RF/RNF + criterios de aceptación) en `docs/v2/`: `01_REQUERIMIENTOS_ETIQUETAS.md`, `02_REQUERIMIENTOS_SITIO_PUBLICO.md`, `03_REQUERIMIENTOS_PORTAL_CLIENTE.md`, `04_REQUERIMIENTOS_DASHBOARDS.md`, `05_REQUERIMIENTOS_VISUAL_UX.md`. **Completado 2026-08-11.**
3. Cada documento tiene su propia sección de preguntas/decisiones abiertas — algunas ya resueltas en la conversación con el usuario, otras (archivo de diseño de etiqueta, tamaño de hoja/diámetro, modelo de cortadora, copy de Home/About, proveedor de mensajería para el portal, auditoría visual) siguen pendientes y bloquean implementar el módulo correspondiente, no el resto del trabajo de documentación.
4. **Completado 2026-08-11**: `06_PLAN_IMPLEMENTACION.md` define el orden real de trabajo entre módulos según bloqueos y dependencias (no sigue el orden 01→05) — primer entregable recomendado: RF-DASH-01 (panel operativo dentro de Entregas).
