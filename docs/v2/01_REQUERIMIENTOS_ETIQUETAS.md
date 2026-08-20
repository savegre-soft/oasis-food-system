# v2 — Requerimientos: Etiquetas de producción

> Módulo 1 de la Fase 3 del roadmap (`00_ROADMAP.md §5.1, §6`). Menor riesgo: no toca RLS ni datos de clientes externos, solo automatiza un proceso manual interno.

---

## 1. Contexto

Hoy cada plato lleva una etiqueta circular (diseño ya existente, impresa en hojas de **papel adhesivo/sticker tamaño estándar**) que el equipo llena **a mano** con 4 datos: nombre del cliente, fecha de producción, fecha de vencimiento y cantidad de macros. Es un proceso manual, lento y propenso a error de transcripción, y no escala con el volumen de pedidos.

## 2. Objetivo

Desde la sección de Entregas, generar automáticamente un archivo/hoja lista para imprimir con todas las etiquetas del lote de producción (una por plato entregado), con los 4 campos completados a partir de los datos ya existentes en el sistema — eliminando el llenado a mano.

## 3. Alcance por fases

El modelo/software de la cortadora digital todavía no está definido (confirmado con el usuario: es digital, modelo por confirmar). Esto separa el trabajo en dos fases:

- **Fase A — Hoja imprimible (este documento la cubre por completo).** Genera una hoja en papel adhesivo tamaño **A3** (ver §4 — medida real confirmada, no carta) con las etiquetas circulares en grilla, usando CSS de impresión (`@media print`), siguiendo el mismo patrón que ya usa `ProductionPrintReport.jsx` (vista previa en pantalla + `window.print()` nativo del navegador, sin librería de PDF nueva). Incluye líneas/marcas de guía para poder cortar a mano o con la cortadora en modo manual. **Esto ya resuelve el problema de raíz (llenado a mano) sin depender de la máquina.**
- **Fase B — Archivo específico para "imprimir y cortar" automático.** Nota técnica importante para cuando se defina la máquina: la mayoría de cortadoras digitales de escritorio (Silhouette, Cricut, y equivalentes) que cortan hojas **ya impresas** no leen un vectorial genérico — usan un flujo de "Print & Cut": se imprime la hoja con **marcas de registro** (marcas de calibración en las esquinas, propias de cada software), se alimenta la hoja a la máquina, y un sensor óptico detecta las marcas para cortar alrededor de cada etiqueta impresa. El formato de esas marcas es específico de cada software, así que **la Fase B no se puede terminar de diseñar hasta saber qué máquina/software van a usar**. Queda como pendiente explícito (ver §7).

## 4. Diseño de la etiqueta

**Resuelto (2026-08-18)**: el usuario compartió el archivo de diseño original (`13 Etiquetas Oasis 11x17_Print.af`, Affinity Designer) y una exportación en PDF (`13 etiquetas y 4 stickers Oasis.pdf`) con el layout real de impresión.

- Círculo de **~8.15 cm (3.2 in) de diámetro**, medido directamente del PDF (13 etiquetas + 4 "stickers" — círculos solo con logo/redes, sin campos de datos, usados para rellenar los huecos del empaquetado tipo panal en la hoja).
- Hoja **A3 (297×420 mm)** — confirmado por el usuario; el nombre del archivo decía "11x17" (Tabloid) pero el PDF exportado mide A3 exacto, y esa es la medida real que usan.
- Contenido de la etiqueta (de afuera hacia adentro): logo Oasis centrado, texto de fondo tipo marca de agua ("Delicioso Sabroso IRRESISTIBLE SIN CULPA Balanceado NATURAL"), franja verde con `@oasis_meals` y WhatsApp `8819-0890`, y los 4 campos de datos variables debajo.
- Los 4 campos y su origen de datos:

| Campo en la etiqueta | Origen en el sistema | Estado |
|---|---|---|
| Nombre del cliente | `clients.name` | Ya existe |
| Cantidad de macros | `order_day_details.protein_value_applied` / `carb_value_applied` (o snapshot del pedido) | Ya existe |
| Fecha de producción | Fecha del día en que se genera la hoja (editable, por defecto hoy) | Se puede derivar, no requiere dato nuevo |
| Fecha de vencimiento | Calculada: fecha de producción + 4 días | **Resuelto (2026-08-11)** — no existe como columna hoy, se calcula al generar la etiqueta, no se almacena |

## 5. Flujo propuesto — **implementado (2026-08-18)**

1. Botón **"Generar etiquetas"** en el header de `/entregas` y `/entregas/express` (junto a "Imprimir resumen"), para el lote de `order_days` visible en ese momento (día seleccionado). `/entregas/combos` queda fuera de alcance — modelo de datos distinto (`combo_item`, sin macros por plato), decisión confirmada con el usuario.
2. Se genera **una etiqueta por unidad física**: por cada `order_day_detail`, se repite `quantity` veces (si `quantity=2`, 2 etiquetas idénticas — cada contenedor necesita la suya).
3. Vista previa en pantalla antes de imprimir (`src/components/LabelPrintSheet.jsx`, mismo patrón que `ProductionPrintReport.jsx`).
4. Impresión vía `window.print()` nativo. Hoja A3: **13 etiquetas reales en el mismo panal (filas de 3 alternadas con filas de 2) que el diseño original, con las 4 postales decorativas llenando los huecos de los bordes** — igual composición que el PDF que compartió el usuario, reconstruida en CSS (ver §5.6). Hoja Carta (cuando sobran pocas etiquetas para justificar una A3 completa): grilla simple 2×3, sin postales, solo utilitaria.
5. **Extra no contemplado en el diseño original, agregado a pedido del usuario**: para pedidos `classification='both'` (Almuerzo+Cena), cada etiqueta lleva un chip ☀️/🌙 (usa `order_day_details.meal_type`) para no confundir los 2 platos del mismo cliente el mismo día — en pedidos históricos sin `meal_type` migrado, simplemente no se muestra el chip (no se adivina).
6. **Diseño reconstruido 100% en CSS, sin imagen de fondo** (decisión final 2026-08-18, tras dos iteraciones intermedias). Se probaron 3 enfoques en orden:
   - v1: recreación en CSS puro (logo + franja + watermark dibujados a mano). Funcionaba pero el usuario pidió fidelidad al diseño real del PDF.
   - v2: recorte exacto de la hoja A3 original (13 etiquetas + 4 stickers + marcas de registro de la cortadora, extraído por análisis de píxeles del PDF) usado como imagen de fondo, con los 4 datos superpuestos encima. Visualmente idéntico al original, pero **el usuario reportó que el PDF salía corrupto al imprimir en un dispositivo real** (no reproducible generando el PDF vía Playwright — sospecha: imagen de varios MB + drivers de impresora física).
   - **v3 (definitivo)**: vuelta a CSS puro (como v1) pero reteniendo todo lo aprendido — sin ninguna imagen de fondo salvo el logo ya existente (`src/assets/Oasis-logo.png`). Elimina de raíz el riesgo de corrupción por imagen grande, y de paso permite **paginado dinámico**: la cantidad de etiquetas define cuántas hojas y de qué tamaño se generan (`PAGE_TYPES` en `LabelPrintSheet.jsx` — A3 13/hoja en panal + 4 postales fijas, Carta 6/hoja en grilla simple; algoritmo voraz: llena hojas grandes mientras el resto no quepa entero en una más chica, así no se desperdicia una A3 completa por 2-3 etiquetas sueltas). Las 13 posiciones del panal de A3 (`A3_LABEL_CENTERS`) y las 4 de las postales (`A3_STICKER_CENTERS`) se reutilizan de la misma medición por análisis de píxeles del PDF original hecha para v2 — solo que ahora posicionan círculos dibujados en CSS, no recortes de imagen. Mezcla de tamaños de página en un mismo trabajo de impresión vía CSS Paged Media (`@page nombre { size: ...; }` + propiedad `page: nombre` por hoja) — soportado en navegadores basados en Chromium.
   - Las marcas de registro de la cortadora **no se pudieron preservar** en v3 (dependían de la imagen exacta del PDF de v2) — quedan como parte de la Fase B (RF-ET-06), a resolver cuando se defina el modelo/software de la cortadora.
7. **Tipografía aproximada al original** (2026-08-19): el PDF original no contiene texto real — todas las letras quedaron convertidas a trazos vectoriales al exportar (confirmado con `pdffonts`/`pdftotext`, cero fuentes/texto extraíble), así que no hay forma de recuperar la fuente exacta. Se identificaron visualmente 5 fuentes gratuitas de Google Fonts como aproximación cercana y se autoalojaron en `src/assets/fonts/` (no se usa el CDN de Google, para no depender de red al imprimir): **Baloo 2** (texto principal: fecha, nombre, macros), **Kaushan Script** ("Delicioso"/"Balanceado" del watermark), **Playfair Display** ("Sabroso"/"Natural"), **Anton** ("Sin culpa"/"Exquisito"/"Irresistible"), **Bungee Outline** ("Rico", con efecto de contorno). Es una aproximación visual, no una certeza — el usuario puede pedir ajustes si alguna no calza bien.
8. **Fondo blanco al imprimir, corregido**: los navegadores omiten colores de fondo al imprimir por defecto (para ahorrar tinta), así que el círculo gris y la franja verde salían blancos en el PDF. Se agregó `print-color-adjust: exact` (+ prefijo `-webkit-`) forzando que los colores/fondos sí se impriman, sin depender de que el usuario marque "Gráficos de fondo" en el diálogo de impresión del navegador.
9. **"Imágenes corruptas" en el PDF (2026-08-19) — causa real: no eran corruptas, eran íconos de imagen rota** porque `window.print()` se llamaba con un tiempo fijo de 150ms tras insertar las etiquetas/postales en el DOM, sin garantía de que las `<img>` ya hubieran cargado. Corregido esperando de verdad a que todas las imágenes del bloque a imprimir terminen de cargar (o fallen) antes de llamar a `window.print()`, con un tope de 5s de seguridad. Verificado simulando una demora de red de 2s: `window.print()` ahora se llama exactamente después de esos 2s, con el 100% de las imágenes ya cargadas en ese momento (antes se llamaba de inmediato, con las imágenes todavía sin cargar).
9. **v4 (definitivo, 2026-08-19): vuelta a imagen real + plantilla configurable desde el sistema.** El usuario prefirió la fidelidad visual de la imagen real (v2) sobre la aproximación en CSS (v3), aceptando el riesgo de reintroducir una imagen al pipeline de impresión — pero ahora cada etiqueta suelta pesa ~150KB (no ~1MB como la hoja completa de v2), y de paso se agregó una función nueva: `operations.label_templates` (nueva tabla + bucket de Storage `label-templates`) permite que el staff suba un reemplazo del diseño de fondo desde **Settings → Etiquetas** (`src/components/settings/LabelTemplateSettings.jsx`) sin pedir un cambio de código — mismo layout de campos (fecha/nombre/macros en las mismas posiciones ya medidas), solo cambia el watermark. Solo una fila puede estar `is_active` a la vez. `LabelPrintSheet.jsx` consulta la fila activa al abrir el modal; si falla o no hay ninguna, cae a un asset empaquetado de respaldo (`src/assets/label-template-default.png`). Las 4 fuentes del watermark (Kaushan/Playfair/Anton/Bungee) ya no se usan — el watermark vuelve a venir dentro de la imagen; Baloo 2 se mantiene para el texto que sí superponemos. Las 4 postales decorativas de A3 siguen fijas en CSS, no dependen de la plantilla configurable.

## 6. RF/RNF

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-ET-01 | El sistema debe generar una hoja imprimible con una etiqueta circular por cada plato (`order_day_detail`, × `quantity`) del lote seleccionado en Entregas. | Alta | ✅ Implementado 2026-08-18 |
| RF-ET-02 | Cada etiqueta debe mostrar: nombre del cliente, fecha de producción, fecha de vencimiento y cantidad de macros (proteína/carbohidrato), leídos automáticamente — sin campos en blanco para llenar a mano. | Alta | ✅ Implementado 2026-08-18 |
| RF-ET-03 | El usuario debe poder elegir/editar la fecha de producción antes de generar la hoja (por defecto, la fecha del día). | Media | ✅ Implementado 2026-08-18 |
| RF-ET-04 | La hoja debe mostrar una vista previa en pantalla antes de imprimir. | Media | ✅ Implementado 2026-08-18 |
| RF-ET-05 | El diseño de la hoja debe incluir líneas o marcas de guía de corte compatibles con corte manual. | Alta | ✅ Implementado 2026-08-18 (borde punteado por etiqueta) |
| RF-ET-06 (Fase B, bloqueado) | El sistema debe poder generar un archivo con marcas de registro compatible con el flujo "Print & Cut" de la cortadora digital que se defina. | Baja — depende de §7 | Bloqueado |
| RF-ET-07 | El sistema debe elegir automáticamente el tamaño de hoja (A3/Carta) y cuántas hojas generar según la cantidad de etiquetas, para no desperdiciar una hoja grande cuando alcanza una más chica. | Media | ✅ Implementado 2026-08-18 |
| RF-ET-08 | El staff debe poder reemplazar la imagen de fondo de la etiqueta (mismo layout de campos, watermark distinto) desde Settings, sin pedir un cambio de código. | Media | ✅ Implementado 2026-08-19 |
| RF-ET-09 | El staff debe poder imprimir una hoja Carta solo con postales decorativas (sin datos de ningún pedido), independiente del lote de etiquetas seleccionado. Las postales deben ser el recorte real del diseño original (texto curvo + íconos IG/WhatsApp), no una recreación en CSS. | Baja | ✅ Implementado 2026-08-19 |

| ID | Requerimiento no funcional | Prioridad | Estado |
|---|---|---|---|
| RNF-ET-01 | No debe agregarse una librería de generación de PDF si el patrón de impresión del navegador (ya usado en `ProductionPrintReport.jsx`) es suficiente para el tamaño de lote típico. | Media | ✅ Cumplido — mismo patrón `window.print()`, sin librerías nuevas |
| RNF-ET-02 | El diámetro y proporciones del círculo impreso deben coincidir con el diseño físico actual (para que la hoja adhesiva calce con el diseño ya aprobado). | Alta | ✅ Cumplido — 8.15cm exacto |

## 7. Preguntas abiertas / dependencias

1. ~~Archivo de diseño original~~ — **Resuelto (2026-08-18)**, ver §4.
2. ~~Regla de vida útil del producto~~ — **Resuelto (2026-08-11): fecha de producción + 4 días, fijo para todo (no varía por receta/categoría).**
3. ~~Tamaño exacto de la hoja adhesiva y diámetro exacto del círculo~~ — **Resuelto (2026-08-18)**, ver §4: hoja A3, círculo ~8.15 cm.
4. **Modelo/software de la cortadora digital** (para Fase B). — *Confirmado con el usuario 2026-08-18: sigue sin definir.* No bloquea la Fase A (hoja imprimible con guías de corte manual), solo bloquea la Fase B ("Print & Cut" automático).

Con 1-3 resueltos, **la Fase A queda desbloqueada para pasar a implementación.** La Fase B queda pendiente hasta que el usuario defina la máquina/software.
