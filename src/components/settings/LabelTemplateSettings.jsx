import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import { UploadCloud, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LabelCircle, FONT_FACES_CSS } from '../LabelPrintSheet';
import DefaultTemplateUrl from '../../assets/label-template-default.png';

// Datos de ejemplo para que el preview se vea como una etiqueta real, no
// solo la plantilla en blanco.
const SAMPLE_ITEM = { clientName: 'Cliente de ejemplo', mealType: 'Lunch', unit: 'g', protein: 150, carb: 200 };
const todayStr = () => new Date().toISOString().split('T')[0];
const addDays = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Administra operations.label_templates: la plantilla de fondo que usa
// LabelPrintSheet.jsx para generar las etiquetas de producción. Solo una
// fila puede estar activa a la vez (índice único parcial en la DB). Subir
// una nueva plantilla no cambia el layout de campos (fecha/nombre/macros
// siguen en las mismas posiciones) — solo reemplaza el diseño de fondo, por
// eso el preview con datos de ejemplo es la única validación antes de guardar.
const LabelTemplateSettings = () => {
  const { supabase } = useApp();
  const [activeUrl, setActiveUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const styleRef = useRef(null);
  const fileInputRef = useRef(null);

  // La fuente del texto superpuesto (Baloo 2) no está cargada en esta
  // página — LabelPrintSheet.jsx la inyecta solo cuando se abre ese modal.
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = FONT_FACES_CSS;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  const fetchActive = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('operations')
      .from('label_templates')
      .select('image_url')
      .eq('is_active', true)
      .maybeSingle();
    if (error) console.error(error);
    setActiveUrl(data?.image_url ?? null);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchActive(), 0);
    return () => clearTimeout(timer);
  }, [supabase]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const cancelPreview = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const storagePath = `templates/${Date.now()}.${fileExt}`;

      // Sin upsert: el path ya incluye Date.now(), nunca choca con uno
      // existente — y el header x-upsert que manda supabase-js con
      // upsert:true dispara una verificación server-side que viola RLS acá
      // (confirmado: el mismo INSERT sin ese header funciona bien).
      const { error: uploadError } = await supabase.storage.from('label-templates').upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('label-templates').getPublicUrl(storagePath);

      const { error: deactivateError } = await supabase
        .schema('operations')
        .from('label_templates')
        .update({ is_active: false })
        .eq('is_active', true);
      if (deactivateError) throw deactivateError;

      const { error: insertError } = await supabase
        .schema('operations')
        .from('label_templates')
        .insert([{ storage_path: storagePath, image_url: urlData.publicUrl, is_active: true }]);
      if (insertError) throw insertError;

      sileo.success('Plantilla de etiqueta actualizada');
      cancelPreview();
      await fetchActive();
    } catch (err) {
      console.error(err);
      sileo.error('No se pudo guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const previewData = {
    item: SAMPLE_ITEM,
    productionDate: todayStr(),
    expirationDate: addDays(todayStr(), 4),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Plantilla de etiqueta</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Imagen de fondo que se usa para generar las etiquetas de producción. Debe tener el mismo diseño/dimensiones
          que la actual (círculo con los campos de fecha, nombre y macros en las mismas posiciones) — solo cambia el
          watermark de fondo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {file ? 'Nueva plantilla (sin guardar)' : 'Plantilla activa'}
          </p>
          {loading ? (
            <p className="text-sm text-slate-400">Cargando...</p>
          ) : (
            <LabelCircle
              item={previewData.item}
              productionDate={previewData.productionDate}
              expirationDate={previewData.expirationDate}
              templateUrl={previewUrl ?? activeUrl ?? DefaultTemplateUrl}
              sizeCm={6}
            />
          )}
        </div>

        <div className="flex flex-col justify-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="label-template-upload"
          />
          {!file ? (
            <label
              htmlFor="label-template-upload"
              className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-4 py-6 text-sm text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer transition"
            >
              <UploadCloud size={16} /> Subir nueva plantilla
            </label>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Tag size={12} /> {file.name}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                >
                  {saving ? 'Guardando...' : 'Confirmar y usar esta plantilla'}
                </button>
                <button
                  type="button"
                  onClick={cancelPreview}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelTemplateSettings;
