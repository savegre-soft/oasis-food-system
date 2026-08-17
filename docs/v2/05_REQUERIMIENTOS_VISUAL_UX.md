# v2 — Requerimientos: Cambios visuales / UX

> Fase 5 del roadmap (`00_ROADMAP.md §5.5, §6`), iterativo. A diferencia de los demás módulos, **este no arranca con una lista de cambios**, porque no tengo evidencia catalogada de inconsistencias reales en las pantallas internas — inventar una lista de "problemas visuales" sin haberlos visto sería adivinar. Arranca con una auditoría.

---

## 1. Contexto

El panel interno cubre 10 módulos funcionales construidos en distintas sesiones de trabajo a lo largo del tiempo (ver `docs/MAPA_DEL_SISTEMA.md`). Es esperable que hayan quedado inconsistencias entre pantallas (espaciados, estados vacíos/de carga/de error, variantes de botones y tablas) aunque la limpieza de código muerto y duplicaciones de julio 2026 ya resolvió los casos más obvios (fusión de `MacroPanel.jsx`, unificación de `STANDARD_MACRO`, eliminación de componentes duplicados). Lo que queda es visual/de consistencia de patrones, no bugs de lógica — y eso todavía no se relevó.

El sitio público (`02_REQUERIMIENTOS_SITIO_PUBLICO.md`) ya tiene su propio lineamiento (RNF-PUB-03: mantener paleta emerald/teal + `framer-motion`). Este módulo es específicamente sobre el **panel interno** (staff/administración).

## 2. Objetivo

Consistencia visual y de UX en las pantallas internas — reutilizar patrones en vez de que cada módulo reinvente su propia variante de tabla, botón o estado vacío. No es un rediseño estético por sí mismo.

## 3. Enfoque: auditoría antes que cambios

Antes de definir qué cambiar, corresponde una revisión visual sistemática de las pantallas internas (con Playwright contra el entorno real, mismo método ya usado en el proyecto para verificar otras entregas), catalogando con capturas concretas:
- Inconsistencias de espaciado/tipografía entre módulos.
- Variantes distintas de un mismo patrón (botones, tablas, estados vacíos/carga/error) que deberían ser un solo componente reutilizable.
- Cualquier pantalla con problemas de usabilidad evidentes (no solo estéticos).

El resultado de esa auditoría es el insumo real para escribir RF puntuales ("unificar X", "extraer componente Y") — que hoy no existen en este documento porque todavía no se relevaron.

## 4. RF/RNF

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-VIS-01 | Debe realizarse una auditoría visual sistemática (Playwright, entorno real) de las pantallas internas, catalogando inconsistencias concretas con evidencia (capturas). | Alta — primer paso, bloquea el resto de este módulo |
| RF-VIS-02 | A partir de la auditoría, se debe generar un catálogo de patrones UI a reutilizar entre módulos (botones, tablas, estados vacíos/carga/error). | Media |
| RF-VIS-03 | Los cambios puntuales que surjan de la auditoría se documentan como ítems separados una vez identificados — no se listan aquí de antemano. | — |

| ID | Requerimiento no funcional | Prioridad |
|---|---|---|
| RNF-VIS-01 | Cualquier cambio visual debe verificarse en navegador real (Playwright) antes de reportarse como terminado, siguiendo la práctica ya usada en el proyecto. | Alta |
| RNF-VIS-02 | Los cambios deben mantenerse dentro de Tailwind 4 y los tokens de color ya en uso — no se introduce un sistema de diseño paralelo. | Alta |

## 5. Próximo paso

Ejecutar la auditoría (RF-VIS-01) como tarea aparte cuando se llegue a esta fase — con eso, este documento se actualiza con hallazgos concretos y RF puntuales en lugar de quedar abierto.
