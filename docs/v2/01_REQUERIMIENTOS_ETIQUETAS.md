# v2 — Requerimientos: Etiquetas de producción

> Módulo 1 de la Fase 3 del roadmap (`00_ROADMAP.md §5.1, §6`). Menor riesgo: no toca RLS ni datos de clientes externos, solo automatiza un proceso manual interno.

---

## 1. Contexto

Hoy cada plato lleva una etiqueta circular (diseño ya existente, impresa en hojas de **papel adhesivo/sticker tamaño estándar**) que el equipo llena **a mano** con 4 datos: nombre del cliente, fecha de producción, fecha de vencimiento y cantidad de macros. Es un proceso manual, lento y propenso a error de transcripción, y no escala con el volumen de pedidos.

## 2. Objetivo

Desde la sección de Entregas, generar automáticamente un archivo/hoja lista para imprimir con todas las etiquetas del lote de producción (una por plato entregado), con los 4 campos completados a partir de los datos ya existentes en el sistema — eliminando el llenado a mano.

## 3. Alcance por fases

El modelo/software de la cortadora digital todavía no está definido (confirmado con el usuario: es digital, modelo por confirmar). Esto separa el trabajo en dos fases:

- **Fase A — Hoja imprimible (este documento la cubre por completo).** Genera una hoja en papel adhesivo tamaño carta con las etiquetas circulares en grilla, usando CSS de impresión (`@media print`), siguiendo el mismo patrón que ya usa `ProductionPrintReport.jsx` (vista previa en pantalla + `window.print()` nativo del navegador, sin librería de PDF nueva). Incluye líneas/marcas de guía para poder cortar a mano o con la cortadora en modo manual. **Esto ya resuelve el problema de raíz (llenado a mano) sin depender de la máquina.**
- **Fase B — Archivo específico para "imprimir y cortar" automático.** Nota técnica importante para cuando se defina la máquina: la mayoría de cortadoras digitales de escritorio (Silhouette, Cricut, y equivalentes) que cortan hojas **ya impresas** no leen un vectorial genérico — usan un flujo de "Print & Cut": se imprime la hoja con **marcas de registro** (marcas de calibración en las esquinas, propias de cada software), se alimenta la hoja a la máquina, y un sensor óptico detecta las marcas para cortar alrededor de cada etiqueta impresa. El formato de esas marcas es específico de cada software, así que **la Fase B no se puede terminar de diseñar hasta saber qué máquina/software van a usar**. Queda como pendiente explícito (ver §7).

## 4. Diseño de la etiqueta

- Se reutiliza el diseño circular ya existente. **Pendiente**: el usuario debe compartir el archivo de diseño original (AI/PSD/SVG/PNG de alta resolución) para poder ubicar el texto en las posiciones exactas — sin el archivo original no se puede reproducir el diseño con fidelidad.
- Los 4 campos y su origen de datos:

| Campo en la etiqueta | Origen en el sistema | Estado |
|---|---|---|
| Nombre del cliente | `clients.name` | Ya existe |
| Cantidad de macros | `order_day_details.protein_value_applied` / `carb_value_applied` (o snapshot del pedido) | Ya existe |
| Fecha de producción | Fecha del día en que se genera la hoja (editable, por defecto hoy) | Se puede derivar, no requiere dato nuevo |
| Fecha de vencimiento | Calculada: fecha de producción + 4 días | **Resuelto (2026-08-11)** — no existe como columna hoy, se calcula al generar la etiqueta, no se almacena |

## 5. Flujo propuesto

1. Desde `/entregas` (o su vista de Empaque), botón **"Generar etiquetas"** para el lote visible según la vista activa (día para Express, semana para producción regular).
2. Se genera una etiqueta por cada `order_day_detail` (mismo nivel de granularidad que ya usan las pantallas de Cocina/Empaque/Entrega) — es decir, una etiqueta por plato entregado, no por cliente ni por pedido completo.
3. Vista previa en pantalla antes de imprimir, igual que el reporte de producción existente.
4. Impresión vía diálogo nativo del navegador, con la hoja ya formateada para el tamaño de papel adhesivo que usan.

## 6. RF/RNF

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-ET-01 | El sistema debe generar una hoja imprimible con una etiqueta circular por cada plato (`order_day_detail`) del lote seleccionado en Entregas. | Alta |
| RF-ET-02 | Cada etiqueta debe mostrar: nombre del cliente, fecha de producción, fecha de vencimiento y cantidad de macros (proteína/carbohidrato), leídos automáticamente — sin campos en blanco para llenar a mano. | Alta |
| RF-ET-03 | El usuario debe poder elegir/editar la fecha de producción antes de generar la hoja (por defecto, la fecha del día). | Media |
| RF-ET-04 | La hoja debe mostrar una vista previa en pantalla antes de imprimir. | Media |
| RF-ET-05 | El diseño de la hoja debe incluir líneas o marcas de guía de corte compatibles con corte manual. | Alta |
| RF-ET-06 (Fase B, bloqueado) | El sistema debe poder generar un archivo con marcas de registro compatible con el flujo "Print & Cut" de la cortadora digital que se defina. | Baja — depende de §7 |

| ID | Requerimiento no funcional | Prioridad |
|---|---|---|
| RNF-ET-01 | No debe agregarse una librería de generación de PDF si el patrón de impresión del navegador (ya usado en `ProductionPrintReport.jsx`) es suficiente para el tamaño de lote típico. | Media |
| RNF-ET-02 | El diámetro y proporciones del círculo impreso deben coincidir con el diseño físico actual (para que la hoja adhesiva calce con el diseño ya aprobado). | Alta |

## 7. Preguntas abiertas / dependencias (bloquean avanzar a implementación)

1. **Archivo de diseño original** de la etiqueta (AI/PSD/SVG/PNG en alta resolución). — *Pendiente, se define más adelante.*
2. ~~Regla de vida útil del producto~~ — **Resuelto (2026-08-11): fecha de producción + 4 días, fijo para todo (no varía por receta/categoría).**
3. **Tamaño exacto** de la hoja adhesiva y **diámetro exacto** del círculo que usan hoy. — *Pendiente, se define más adelante.*
4. **Modelo/software de la cortadora digital** (para Fase B). — *Pendiente, se define más adelante.*

Los pendientes 1, 3 y 4 no bloquean redactar RF/RNF de otros módulos, pero sí bloquean pasar este módulo a implementación — quedan como tareas abiertas a resolver antes de esa etapa.
