// Lista los usuarios de Supabase Auth que se registraron pero todavía no
// confirmaron su email (email_confirmed_at es null). Esto no se puede leer
// desde el cliente con la clave anon/authenticated — requiere la Admin API,
// que solo funciona con la service role key (nunca expuesta al navegador).
//
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los provee Supabase automáticamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(error.message);

    const pending = (data.users ?? [])
      .filter((u) => !u.email_confirmed_at)
      .map((u) => ({ id: u.id, email: u.email, created_at: u.created_at }));

    return new Response(JSON.stringify({ users: pending }), {
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
