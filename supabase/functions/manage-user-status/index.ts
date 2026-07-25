// Activar/desactivar el acceso de un usuario y consultar el estado de todos.
// "Desactivar" = banear vía Supabase Auth Admin API: la persona ya no puede
// iniciar sesión hasta que un admin la reactive. Requiere la service role key
// (nunca expuesta al navegador) — por eso vive en una Edge Function.
//
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los provee Supabase automáticamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Duración de baneo "permanente" — Supabase no tiene un flag explícito de
// baneo indefinido, la convención es usar una duración muy larga.
const BAN_DURATION = '876000h';

// Superadmin de la plataforma — nunca se puede desactivar, ni siquiera
// llamando esta función directamente (el botón deshabilitado en el frontend
// es solo la primera capa; esta es la que realmente lo garantiza).
const PROTECTED_EMAIL = 'savegre.soft@gmail.com';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { action, userId } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'status') {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw new Error(error.message);
      const statuses = (data.users ?? []).map((u) => ({
        id: u.id,
        banned_until: u.banned_until ?? null,
      }));
      return json({ statuses });
    }

    if (!userId) return json({ error: 'Falta userId' }, 400);

    if (action === 'ban') {
      const { data: targetUser, error: getError } = await supabase.auth.admin.getUserById(userId);
      if (getError) throw new Error(getError.message);
      if (targetUser.user?.email === PROTECTED_EMAIL) {
        return json({ error: 'Esta cuenta es el superadmin de la plataforma y no se puede desactivar' }, 403);
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: BAN_DURATION,
      });
      if (error) throw new Error(error.message);
      return json({ ok: true });
    }

    if (action === 'unban') {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
      if (error) throw new Error(error.message);
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida' }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: err.message ?? 'Error desconocido' }, 500);
  }
});
