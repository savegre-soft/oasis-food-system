# v2 — Plan de orden de implementación

> Este documento reordena los 5 módulos de requerimientos (`01` a `05`) por **dependencias reales y bloqueos actuales**, no por el número de fase con el que se documentaron. La numeración de fases de `00_ROADMAP.md` sigue siendo válida como agrupación temática; este documento es la secuencia concreta de trabajo.

---

## 1. Estado de bloqueos por módulo (al 2026-08-11)

| Módulo | Pendientes que bloquean implementación | ¿Listo para arrancar? |
|---|---|---|
| **Dashboards** (`04`) | Ninguno, salvo RF-DASH-03 (adopción del portal) que depende de que el portal exista | **Sí** (RF-DASH-01/02) |
| **Sitio público** (`02`) | Contenido real de About | **Casi todo sí** (todo menos About) |
| **Base de seguridad — RLS/permisos** (parte de `03`, RNF-PC-01/02) | Ninguno — es una decisión de diseño técnico, no depende de un dato externo | **Sí** |
| **Portal de cliente** (`03`, el resto) | Depende de que la base de seguridad esté lista primero; proveedor de mensajería sin definir (bloquea solo RF-PC-10) | Parcial — el envío manual (RF-PC-09) no espera al proveedor |
| **Etiquetas** (`01`) | Archivo de diseño, tamaño de hoja/diámetro, modelo de cortadora — **ninguno de los 3 resuelto** | **No** — es el único módulo sin nada por dónde empezar hoy |
| **Visual/UX** (`05`) | Ninguno, pero conviene auditar cuando ya existan las pantallas nuevas (Portal, Prospectos, panel operativo), no antes | Sí, pero mejor al final |

## 2. Orden propuesto

No sigue el orden 01→05 de los documentos, sino este:

### Etapa 1 — Quick wins sin bloqueos (Dashboards operativos + Sitio público)
1. **RF-DASH-01 / RF-DASH-02** (panel operativo dentro de Entregas, salud de cobros) — no toca seguridad ni depende de nadie, valor inmediato para el equipo.
2. **Sitio público** (`02`) completo salvo About: Home, Menú (ajuste del botón), Promociones (con imagen → Supabase Storage), Contacto persistente, bandeja "Prospectos". Es la segunda pieza más lista y de menor riesgo (RLS de solo-inserción, acotada — RNF-PUB-01).
3. About se completa apenas el usuario provea el contenido — no bloquea el resto de esta etapa.

### Etapa 2 — Base de seguridad (rediseño de RLS/permisos)
4. Diseño e implementación de las funciones `SECURITY DEFINER` y el nuevo modelo de permisos (RNF-PC-01/02 de `03`). **Es prerrequisito duro del portal** — no es un "módulo" con RF propios todavía, así que antes de programarlo conviene un documento técnico corto aparte (`07_DISEÑO_RLS.md`, a redactar cuando se llegue a esta etapa) que detalle las funciones y políticas concretas.

### Etapa 3 — Portal de clientes
5. Portal de clientes (`03`) completo: enlace por token, ver plan, seleccionar/confirmar pedido semanal, edición con corte, envío manual del enlace (RF-PC-09). El envío automatizado (RF-PC-10) queda como mejora inmediata posterior, en cuanto se elija proveedor de mensajería — no bloquea el resto del portal.
6. **RF-DASH-03** (adopción del portal) se activa recién acá, una vez que `created_via` empieza a poblarse con datos reales.

### Etapa 4 — Etiquetas (cuando se resuelvan sus pendientes)
7. Etiquetas (`01`) — no tiene dependencia técnica de ningún otro módulo, así que puede insertarse en **cualquier punto** de esta secuencia apenas el usuario aporte los 3 datos pendientes (diseño, medidas, modelo de cortadora). No hay razón para que esta etapa espere a que termine el portal; solo espera a que existan esos datos.

### Etapa 5 — Auditoría visual/UX
8. Auditoría (`05`, RF-VIS-01) al final, sobre el sistema ya con Prospectos, panel operativo y portal construidos — cubre más superficie real de una sola vez que auditar ahora y otra vez después de agregar 3 módulos nuevos.

## 3. Resumen visual del orden

```
Etapa 1: Dashboards operativos ──┐
         Sitio público ──────────┤→ en paralelo conceptual, sin dependencia entre sí
Etapa 2: Rediseño de RLS/permisos (prerrequisito duro de Portal)
Etapa 3: Portal de clientes → activa RF-DASH-03 (adopción)
Etapa 4: Etiquetas — sin dependencias, entra apenas haya datos (puede ir en paralelo a cualquier etapa)
Etapa 5: Auditoría visual/UX — al final, sobre el sistema ya ampliado
```

## 4. Primer entregable recomendado

**RF-DASH-01 (panel operativo dentro de Entregas)**: es el de menor riesgo técnico de todos (no toca seguridad, no depende de datos externos, usa datos que ya existen), de valor inmediato y visible para el equipo de piso, y sirve como primer entregable real de la v2 para validar el flujo de trabajo antes de encarar módulos más grandes.
