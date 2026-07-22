// Genera una imagen ilustrativa del combo de la semana con OpenAI (gpt-image-1),
// la sube al bucket de Storage "combo-images" y guarda la URL en combo_weeks.
//
// Requiere el secreto OPENAI_API_KEY configurado en el proyecto de Supabase
// (dashboard → Edge Functions → Secrets, o `supabase secrets set OPENAI_API_KEY=...`).
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los provee Supabase automáticamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_LABEL: Record<string, string> = {
  arroz: 'Arroz',
  proteina: 'Proteína',
  acompanamiento: 'Acompañamiento',
  extra: 'Extra',
  plato_extra: 'Plato Extra',
};

const COMBO_WEEK_SELECT = `
  id_combo_week, week_start_date, week_end_date,
  combo_week_categories (
    category,
    combo_week_category_items ( combo_items ( name ) )
  )
`;

function buildPrompt(comboWeek: any): string {
  const parts: string[] = [];
  for (const cat of comboWeek.combo_week_categories ?? []) {
    const names = (cat.combo_week_category_items ?? [])
      .map((cwci: any) => cwci.combo_items?.name)
      .filter(Boolean);
    if (names.length === 0) continue;
    const label = CATEGORY_LABEL[cat.category] ?? cat.category;
    parts.push(`${label}: ${names.join(', ')}`);
  }

  const description = parts.length > 0
    ? parts.join('. ')
    : 'un combo de almuerzo variado y balanceado';

  return (
    `Fotografía profesional de comida de un plato de combo de almuerzo servido en un ` +
    `plato blanco redondo, visto desde arriba, sobre una mesa de madera clara. ` +
    `El plato incluye: ${description}. ` +
    `Iluminación natural, estilo editorial de restaurante, colores apetitosos, ` +
    `alta definición, sin texto ni logotipos en la imagen.`
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { comboWeekId } = await req.json();
    if (!comboWeekId) {
      return new Response(JSON.stringify({ error: 'Falta comboWeekId' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: comboWeek, error: fetchError } = await supabase
      .schema('operations')
      .from('combo_weeks')
      .select(COMBO_WEEK_SELECT)
      .eq('id_combo_week', comboWeekId)
      .single();

    if (fetchError || !comboWeek) {
      throw new Error(fetchError?.message ?? 'Combo de la semana no encontrado');
    }

    const prompt = buildPrompt(comboWeek);

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        n: 1,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      throw new Error(`OpenAI respondió ${openaiRes.status}: ${errBody}`);
    }

    const openaiJson = await openaiRes.json();
    const b64 = openaiJson.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI no devolvió una imagen');

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const filePath = `combo-week-${comboWeekId}.png`;

    const { error: uploadError } = await supabase.storage
      .from('combo-images')
      .upload(filePath, bytes, { upsert: true, contentType: 'image/png' });

    if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from('combo-images')
      .getPublicUrl(filePath);

    // Cache-bust para que "regenerar" se refleje al instante en el <img>.
    const imageUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .schema('operations')
      .from('combo_weeks')
      .update({ image_url: imageUrl, image_generated_at: new Date().toISOString() })
      .eq('id_combo_week', comboWeekId);

    if (updateError) throw new Error(`Error guardando la URL: ${updateError.message}`);

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message ?? 'Error desconocido' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
