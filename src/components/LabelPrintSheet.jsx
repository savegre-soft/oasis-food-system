import { useEffect, useRef, useState } from 'react';
import { X, Printer, Tags, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DefaultTemplateUrl from '../assets/label-template-default.png';
import StickerUrl from '../assets/sticker-default.png';
import Baloo2Url from '../assets/fonts/Baloo2.woff2';

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: '2-digit' });

// La plantilla ya trae los "/" impresos entre 3 casillas (día/mes/año en 2
// dígitos) — acá solo se separan los 3 números, sin slashes propios.
const dateParts = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: String(d.getFullYear()).slice(-2),
  };
};

// Los clientes plan "nutricional" llevan macros en gramos reales; los de plan
// "estandar" usan unidades abstractas (STANDARD_MACRO = 4/2, ver orderUtils.js)
// — no son gramos literales. Por eso la unidad depende del cliente, no es fija.
const macroUnit = (planType) => (planType === 'nutricional' ? 'g' : 'ud.');

const fmtMacro = (val, unit) => {
  if (val == null || isNaN(Number(val))) return '—';
  const n = Math.round(Number(val) * 10) / 10;
  return unit === 'g' ? `${n}g` : `${n} ${unit}`;
};

const MEAL_LABEL = { Lunch: 'Almuerzo', Dinner: 'Cena' };

// Una etiqueta por unidad física — si quantity=2, se repite el item 2 veces.
const buildLabelItems = (orderDays) => {
  const items = [];
  for (const od of orderDays ?? []) {
    const clientName = od.orders?.clients?.name ?? '(sin nombre)';
    const unit = macroUnit(od.orders?.clients?.plan_type);
    const mealClassification = od.orders?.classification;
    for (const det of od.order_day_details ?? []) {
      // 'both': el plato ya trae su propio meal_type (fix de esta sesión).
      // 'Lunch'/'Dinner': el pedido entero es de un solo tiempo de comida.
      const mealType =
        det.meal_type ??
        (mealClassification === 'Lunch' || mealClassification === 'Dinner' ? mealClassification : null);
      const qty = Number(det.quantity) || 1;
      for (let i = 0; i < qty; i++) {
        items.push({
          clientName,
          mealType,
          unit,
          protein: det.protein_value_applied,
          carb: det.carb_value_applied,
        });
      }
    }
  }
  return items.sort((a, b) => a.clientName.localeCompare(b.clientName));
};

// ── Diseño de la etiqueta — imagen real (plantilla configurable) + overlay ──
// La imagen de fondo viene de operations.label_templates (fila activa) — el
// staff puede reemplazarla desde Settings → Etiquetas sin pedir un cambio de
// código (misma etiqueta/dimensiones, solo cambia el watermark). Si no hay
// fila activa o falla la consulta, se usa un asset empaquetado de respaldo
// (src/assets/label-template-default.png) para que el sistema nunca se
// quede sin plantilla utilizable.

const LABEL_SIZE_CM = 8.15;
// Diámetro real de las postales decorativas, medido del PDF original — son
// más chicas que la etiqueta principal (~58% del diámetro).
const STICKER_SIZE_CM = 4.75;

// Fuente aproximada al texto real de la plantilla (el PDF original no trae
// texto real — todas las letras quedaron convertidas a trazos vectoriales al
// exportar, no hay forma de extraer la fuente exacta). Se aplica solo al
// texto que superponemos (fecha/nombre/macros), no al watermark — ese ya
// viene dentro de la imagen de fondo.
const FONT_MAIN = "'Oasis Baloo', sans-serif";
export const FONT_FACES_CSS = `
@font-face { font-family: 'Oasis Baloo'; src: url(${Baloo2Url}) format('woff2'); font-weight: 400 800; font-display: swap; }
`;

// Posiciones de los 4 campos sobre la plantilla (% del diámetro de una
// etiqueta suelta), medidas por análisis de píxeles del diseño original.
const FIELD_POS = {
  nombre: { left: '26.5%', width: '62.1%', top: '63%', height: '8.5%' },
  macros: { left: '36.6%', width: '46.0%', top: '75.0%', height: '16.6%' },
};
const DATE_Y = '60.8%';
const DATE_SLOTS = {
  prodDate: ['26.9%', '34.6%', '42.7%'],
  expDate: ['75.3%', '83.0%', '91.1%'],
};

// Posiciones (centro, % de la hoja) de las 13 etiquetas reales en A3,
// dispuestas en el mismo panal que el diseño original que compartió el
// usuario (filas de 3 alternadas con filas de 2, para que 4 postales
// decorativas llenen los huecos de los bordes) — medidas por análisis de
// píxeles del PDF original.
const A3_LABEL_CENTERS = [
  { left: '22.29%', top: '15.18%' },
  { left: '49.71%', top: '15.19%' },
  { left: '78.11%', top: '15.25%' },
  { left: '36.07%', top: '32.55%' },
  { left: '64.32%', top: '32.41%' },
  { left: '21.95%', top: '49.68%' },
  { left: '49.5%', top: '49.75%' },
  { left: '77.68%', top: '49.67%' },
  { left: '35.65%', top: '66.92%' },
  { left: '64.11%', top: '67.02%' },
  { left: '22.15%', top: '84.58%' },
  { left: '49.49%', top: '84.49%' },
  { left: '77.89%', top: '84.58%' },
];
// Las 4 postales decorativas — solo logo, sin datos, en los huecos que deja
// el panal (mismo lugar que el diseño original). No dependen de la
// plantilla configurable: siempre usan el logo fijo del repo.
const A3_STICKER_CENTERS = [
  { left: '12.31%', top: '31.28%' },
  { left: '83.88%', top: '31.26%' },
  { left: '11.89%', top: '65.67%' },
  { left: '83.45%', top: '65.65%' },
];

// ── Paginado dinámico — evita desperdiciar una hoja grande si sobran pocas
// etiquetas. Voraz: llena hojas grandes mientras el resto no quepa entero en
// una más chica; para el resto, usa la hoja más chica que lo contenga.
const PAGE_TYPES = [
  { id: 'a3', label: 'A3', widthCm: 29.7, heightCm: 42, capacity: A3_LABEL_CENTERS.length },
  { id: 'carta', label: 'Carta', widthCm: 21.59, heightCm: 27.94, cols: 2, rows: 3, capacity: 6 },
];

const paginate = (n) => {
  const byCapDesc = [...PAGE_TYPES].sort((a, b) => b.capacity - a.capacity);
  const pages = [];
  let remaining = n;
  while (remaining > 0) {
    const smallestThatFits = byCapDesc
      .filter((t) => t.capacity >= remaining)
      .sort((a, b) => a.capacity - b.capacity)[0];
    const type = smallestThatFits ?? byCapDesc[0];
    const count = Math.min(remaining, type.capacity);
    pages.push({ type, count });
    remaining -= count;
  }
  return pages;
};

// ── Print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body > *:not(#oasis-print-labels) { display: none !important; }
  #oasis-print-labels { display: block !important; }
  #oasis-print-labels .oasis-page { page-break-after: always; }
  #oasis-print-labels .oasis-page:last-child { page-break-after: auto; }
  /* Sin esto, la mayoría de navegadores omiten colores/fondos al imprimir
     (para ahorrar tinta) — el fondo de las postales salía blanco. */
  #oasis-print-labels, #oasis-print-labels * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  @page a3 { size: A3; margin: 0; }
  @page carta { size: letter; margin: 0.3cm; }
}
`;

// ── Una etiqueta (preview en pantalla) ──────────────────────────────────────

const DateSlotsPreview = ({ dateStr, slots, sizeCm }) => {
  const parts = dateParts(dateStr);
  const keys = ['day', 'month', 'year'];
  return slots.map((left, i) => (
    <div
      key={keys[i]}
      style={{
        position: 'absolute',
        left,
        top: DATE_Y,
        transform: 'translate(-50%, -50%)',
        color: '#5A6310',
        fontWeight: 700,
        fontSize: `${sizeCm * 0.03}cm`,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {parts[keys[i]]}
    </div>
  ));
};

export const LabelCircle = ({ item, productionDate, expirationDate, templateUrl, sizeCm = LABEL_SIZE_CM }) => (
  <div style={{ width: `${sizeCm}cm`, height: `${sizeCm}cm`, position: 'relative', fontFamily: FONT_MAIN }}>
    <img src={templateUrl} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />

    <DateSlotsPreview dateStr={productionDate} slots={DATE_SLOTS.prodDate} sizeCm={sizeCm} />
    <DateSlotsPreview dateStr={expirationDate} slots={DATE_SLOTS.expDate} sizeCm={sizeCm} />

    <div style={{ position: 'absolute', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#5A6310', fontWeight: 800, fontSize: `${sizeCm * 0.034}cm`, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', ...FIELD_POS.nombre }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.clientName}</span>
    </div>
    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5A6310', fontWeight: 700, fontSize: `${sizeCm * 0.03}cm`, lineHeight: 1.4, textAlign: 'center', ...FIELD_POS.macros }}>
      <span>{fmtMacro(item.protein, item.unit)} prot · {fmtMacro(item.carb, item.unit)} carb</span>
      {item.mealType && <span>{MEAL_LABEL[item.mealType]}</span>}
    </div>
  </div>
);

// ── HTML string for print ──────────────────────────────────────────────────

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const buildDateSlotsHTML = (dateStr, slots) => {
  const parts = dateParts(dateStr);
  const keys = ['day', 'month', 'year'];
  return slots
    .map(
      (left, i) =>
        `<div style="position:absolute;left:${left};top:${DATE_Y};transform:translate(-50%, -50%);color:#5A6310;font-weight:700;font-size:9px;line-height:1;white-space:nowrap;">${parts[keys[i]]}</div>`
    )
    .join('');
};

const fieldStyle = (pos) =>
  `position:absolute;left:${pos.left};width:${pos.width};top:${pos.top};height:${pos.height};box-sizing:border-box;`;

function buildLabelHTML(item, productionDate, expirationDate, templateUrl) {
  return `<div style="width:${LABEL_SIZE_CM}cm;height:${LABEL_SIZE_CM}cm;position:relative;font-family:${FONT_MAIN};">
    <img src="${templateUrl}" alt="" style="width:100%;height:100%;display:block;" />
    ${buildDateSlotsHTML(productionDate, DATE_SLOTS.prodDate)}
    ${buildDateSlotsHTML(expirationDate, DATE_SLOTS.expDate)}
    <div style="${fieldStyle(FIELD_POS.nombre)}display:flex;align-items:flex-end;justify-content:center;color:#5A6310;font-weight:800;font-size:10px;line-height:1;white-space:nowrap;overflow:hidden;">
      <span style="overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.clientName)}</span>
    </div>
    <div style="${fieldStyle(FIELD_POS.macros)}display:flex;flex-direction:column;align-items:center;justify-content:center;color:#5A6310;font-weight:700;font-size:9px;line-height:1.4;text-align:center;">
      <span>${escapeHtml(fmtMacro(item.protein, item.unit))} prot &middot; ${escapeHtml(fmtMacro(item.carb, item.unit))} carb</span>
      ${item.mealType ? `<span>${escapeHtml(MEAL_LABEL[item.mealType])}</span>` : ''}
    </div>
  </div>`;
}

// Postal decorativa (sin datos) — recorte real de las postales pequeñas del
// PDF original (logo + texto curvo "oasis_meals"/teléfono con íconos de IG y
// WhatsApp), no una recreación en CSS — el usuario pidió que fuera igual a
// las del PDF. Son más chicas que la etiqueta principal (~4.75cm vs 8.15cm),
// medido directamente del diseño original. No dependen de la plantilla
// configurable de Settings, siempre usan este recorte fijo.
function buildStickerHTML() {
  return `<div style="width:${STICKER_SIZE_CM}cm;height:${STICKER_SIZE_CM}cm;box-sizing:border-box;">
    <img src="${StickerUrl}" alt="Oasis" style="width:100%;height:100%;display:block;" />
  </div>`;
}

const positioned = (centerPct, html) =>
  `<div style="position:absolute;left:${centerPct.left};top:${centerPct.top};transform:translate(-50%, -50%);">${html}</div>`;

// Hoja A3: panal de 13 etiquetas + 4 postales, posiciones fijas
// (A3_LABEL_CENTERS/A3_STICKER_CENTERS) igual que el diseño original.
function buildA3PageHTML(pageItems, productionDate, expirationDate, templateUrl) {
  const labels = pageItems
    .map((item, i) => positioned(A3_LABEL_CENTERS[i], buildLabelHTML(item, productionDate, expirationDate, templateUrl)))
    .join('');
  const stickers = A3_STICKER_CENTERS.map((c) => positioned(c, buildStickerHTML())).join('');
  return `<div class="oasis-page" style="page:a3;width:29.7cm;height:42cm;position:relative;box-sizing:border-box;">
    ${labels}
    ${stickers}
  </div>`;
}

// Hoja Carta: grilla simple, sin postales — es la hoja "sobrante" utilitaria,
// no necesita la composición decorativa de la A3. El div NO fuerza el
// alto/ancho nominal del papel (eso ya lo resuelve @page) — su tamaño sale
// solo del contenido real (grid-auto-rows), así nunca se pasa por unos
// milímetros del área imprimible ni empuja una hoja extra en blanco.
const LABEL_GAP_CM = 0.1;

function buildCartaPageHTML(pageItems, pageType, productionDate, expirationDate, templateUrl) {
  const labels = pageItems.map((item) => buildLabelHTML(item, productionDate, expirationDate, templateUrl)).join('');
  const gridWidth = pageType.cols * LABEL_SIZE_CM + (pageType.cols - 1) * LABEL_GAP_CM;
  return `<div class="oasis-page" style="page:${pageType.id};width:${gridWidth}cm;margin:0 auto;display:grid;grid-template-columns:repeat(${pageType.cols}, ${LABEL_SIZE_CM}cm);grid-auto-rows:${LABEL_SIZE_CM}cm;gap:${LABEL_GAP_CM}cm;">
    ${labels}
  </div>`;
}

function buildPageHTML(pageItems, pageType, productionDate, expirationDate, templateUrl) {
  return pageType.id === 'a3'
    ? buildA3PageHTML(pageItems, productionDate, expirationDate, templateUrl)
    : buildCartaPageHTML(pageItems, pageType, productionDate, expirationDate, templateUrl);
}

// Hoja aparte, solo de postales decorativas (sin datos de ningún pedido) —
// llena una Carta con todas las que caben. Grilla propia (no la de las
// etiquetas reales): al ser más chicas (STICKER_SIZE_CM < LABEL_SIZE_CM),
// caben más por hoja — 4×5=20 en vez de las 6 etiquetas grandes que caben
// en la misma Carta.
const STICKER_GRID = { cols: 4, rows: 5 };

function buildStickerSheetHTML() {
  const stickers = Array.from({ length: STICKER_GRID.cols * STICKER_GRID.rows }, () => buildStickerHTML()).join('');
  const gridWidth = STICKER_GRID.cols * STICKER_SIZE_CM + (STICKER_GRID.cols - 1) * LABEL_GAP_CM;
  return `<div class="oasis-page" style="page:carta;width:${gridWidth}cm;margin:0 auto;display:grid;grid-template-columns:repeat(${STICKER_GRID.cols}, ${STICKER_SIZE_CM}cm);grid-auto-rows:${STICKER_SIZE_CM}cm;gap:${LABEL_GAP_CM}cm;">
    ${stickers}
  </div>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const LabelPrintSheet = ({ orderDays, onClose }) => {
  const { supabase } = useApp();
  const styleRef = useRef(null);
  const printDivRef = useRef(null);
  const [productionDate, setProductionDate] = useState(todayStr());
  const [templateUrl, setTemplateUrl] = useState(DefaultTemplateUrl);

  const expirationDate = addDays(productionDate, 4);
  const items = buildLabelItems(orderDays);
  const pagesPlan = paginate(items.length);

  useEffect(() => {
    const style = document.createElement('style');
    // Las @font-face van fuera del @media print para que también se vean
    // bien en el preview en pantalla, no solo al imprimir.
    style.textContent = FONT_FACES_CSS + PRINT_STYLES;
    document.head.appendChild(style);
    styleRef.current = style;

    const div = document.createElement('div');
    div.id = 'oasis-print-labels';
    div.style.cssText = 'display:none;';
    document.body.appendChild(div);
    printDivRef.current = div;

    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
      if (printDivRef.current) document.body.removeChild(printDivRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .schema('operations')
        .from('label_templates')
        .select('image_url')
        .eq('is_active', true)
        .maybeSingle();
      if (data?.image_url) setTemplateUrl(data.image_url);
    }, 0);
    return () => clearTimeout(timer);
  }, [supabase]);

  // Espera a que TODAS las <img> del bloque a imprimir terminen de cargar de
  // verdad antes de llamar a window.print() — un timeout fijo (como se hacía
  // antes) alcanza a veces, pero en la práctica el navegador puede llegar a
  // imprimir antes de que las imágenes recién insertadas en el DOM terminen
  // de cargar, mostrando el ícono de "imagen rota" en el PDF en vez del
  // contenido real (reportado por el usuario, sobre todo en "Solo postales",
  // que a diferencia de "Imprimir / PDF" no tiene un preview en pantalla que
  // precargue esa imagen antes). Con tope de 5s por si alguna imagen
  // realmente falla, para no colgar la impresión indefinidamente.
  const waitForImages = (container) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    const loaders = imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        })
    );
    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
    return Promise.race([Promise.all(loaders), timeout]);
  };

  const printHtml = (html) => {
    const div = printDivRef.current;
    if (!div) return;

    div.innerHTML = html;
    div.style.display = 'block';
    requestAnimationFrame(async () => {
      await waitForImages(div);
      window.print();
      div.style.display = 'none';
    });
  };

  const handlePrint = () => {
    let cursor = 0;
    const html = pagesPlan
      .map(({ type, count }) => {
        const pageItems = items.slice(cursor, cursor + count);
        cursor += count;
        return buildPageHTML(pageItems, type, productionDate, expirationDate, templateUrl);
      })
      .join('');
    printHtml(html);
  };

  const handlePrintStickers = () => printHtml(buildStickerSheetHTML());

  const planLabel = pagesPlan
    .map(({ type, count }) => `${type.label} (${count})`)
    .join(' + ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Etiquetas de producción</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {items.length} etiqueta{items.length !== 1 ? 's' : ''}
              {items.length > 0 && <> · {planLabel}</>}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Fecha de producción
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
              />
            </label>
            <span className="text-xs text-slate-400">Vence: {fmtDate(expirationDate)}</span>
            <button
              onClick={handlePrintStickers}
              title={`Hoja Carta con ${STICKER_GRID.cols * STICKER_GRID.rows} postales decorativas, sin datos`}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <Layers size={14} /> Solo postales
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <Printer size={14} /> Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Tags size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay platos para generar etiquetas en este lote</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
              {items.map((item, i) => (
                <LabelCircle key={i} item={item} productionDate={productionDate} expirationDate={expirationDate} templateUrl={templateUrl} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelPrintSheet;
