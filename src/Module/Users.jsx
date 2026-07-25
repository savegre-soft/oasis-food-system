import { useApp } from '../context/AppContext';
import { useEffect, useState, useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> below; no-unused-vars doesn't see JSX member-expression usage here
import { motion } from 'framer-motion';
import { Mail, Clock, UserX, UserCheck } from 'lucide-react';
import { sileo } from 'sileo';
import ConfirmDialog from '../components/ConfirmDialog';

// Superadmin de la plataforma — nunca se puede desactivar. Esto solo
// deshabilita el botón; la garantía real está en manage-user-status.
const PROTECTED_EMAIL = 'savegre.soft@gmail.com';

const Users = () => {
  const { supabase, user } = useApp();

  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loadingCells, setLoadingCells] = useState(new Set());
  const [pendingUsers, setPendingUsers] = useState([]);
  const [resendingId, setResendingId] = useState(null);
  const [banStatuses, setBanStatuses] = useState(new Map()); // id -> banned_until
  const [togglingId, setTogglingId] = useState(null);
  const [deactivatingUser, setDeactivatingUser] = useState(null);

  const GetUserRoles = useCallback(async () => {
    const { data, error } = await supabase.schema('operations').from('userRoles').select('*');
    if (error) return console.error(error);
    setUserRoles(data || []);
  }, [supabase]);

  const GetRoles = useCallback(async () => {
    const { data, error } = await supabase.schema('operations').from('Roles').select('*');
    if (error) return console.error(error);
    setRoles(data || []);
  }, [supabase]);

  const GetUsers = useCallback(async () => {
    const { data, error } = await supabase.schema('operations').from('profiles').select('*');
    if (error) return console.error(error);
    setProfiles(data || []);
  }, [supabase]);

  // auth.users no se puede leer con la clave anon/authenticated — requiere la
  // Admin API vía la Edge Function `list-unverified-users` (service role key).
  const GetPendingUsers = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('list-unverified-users');
    if (error) return console.error(error);
    setPendingUsers(data?.users ?? []);
  }, [supabase]);

  // Estado activo/desactivado (baneado) de cada usuario — también requiere
  // Admin API, vía `manage-user-status`.
  const GetUserStatuses = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('manage-user-status', {
      body: { action: 'status' },
    });
    if (error) return console.error(error);
    const map = new Map((data?.statuses ?? []).map((s) => [s.id, s.banned_until]));
    setBanStatuses(map);
  }, [supabase]);

  useEffect(() => {
    const run = async () => {
      await Promise.all([GetUsers(), GetRoles(), GetUserRoles(), GetPendingUsers(), GetUserStatuses()]);
    };
    run();
  }, [GetUsers, GetRoles, GetUserRoles, GetPendingUsers, GetUserStatuses]);

  const handleResend = async (pendingUser) => {
    setResendingId(pendingUser.id);
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendingUser.email });
    if (error) {
      sileo.error('No se pudo reenviar el correo: ' + error.message);
    } else {
      sileo.success('Correo de confirmación reenviado a ' + pendingUser.email);
    }
    setResendingId(null);
  };

  const isBanned = (userId) => {
    const bannedUntil = banStatuses.get(userId);
    return !!bannedUntil && new Date(bannedUntil) > new Date();
  };

  const handleReactivate = async (targetUser) => {
    setTogglingId(targetUser.id);
    const { error } = await supabase.functions.invoke('manage-user-status', {
      body: { action: 'unban', userId: targetUser.id },
    });
    if (error) {
      sileo.error('No se pudo reactivar el usuario');
    } else {
      sileo.success(targetUser.email + ' reactivado');
      await GetUserStatuses();
    }
    setTogglingId(null);
  };

  const handleConfirmDeactivate = async () => {
    const targetUser = deactivatingUser;
    if (!targetUser) return;
    setDeactivatingUser(null);
    setTogglingId(targetUser.id);
    const { error } = await supabase.functions.invoke('manage-user-status', {
      body: { action: 'ban', userId: targetUser.id },
    });
    if (error) {
      sileo.error('No se pudo desactivar el usuario');
    } else {
      sileo.success(targetUser.email + ' desactivado');
      await GetUserStatuses();
    }
    setTogglingId(null);
  };

  const userRoleMap = useMemo(() => {
    const map = new Map();
    userRoles.forEach((ur) => {
      if (!map.has(ur.userId)) map.set(ur.userId, new Set());
      map.get(ur.userId).add(ur.rolId);
    });
    return map;
  }, [userRoles]);

  const toggleRole = async (userId, roleId) => {
    const key = `${userId}-${roleId}`;
    if (loadingCells.has(key)) return;

    const currentRoles = userRoleMap.get(userId) || new Set();
    const hasRole = currentRoles.has(roleId);

    const newUserRoles = hasRole
      ? userRoles.filter((ur) => !(ur.userId === userId && ur.rolId === roleId))
      : [...userRoles, { userId, rolId: roleId }];

    setUserRoles(newUserRoles);
    setLoadingCells((prev) => new Set(prev).add(key));

    try {
      if (hasRole) {
        const { error } = await supabase
          .schema('operations')
          .from('userRoles')
          .delete()
          .match({ userId, rolId: roleId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('operations')
          .from('userRoles')
          .insert({ userId, rolId: roleId });
        if (error) throw error;
      }
    } catch (error) {
      console.error(error);
      setUserRoles(userRoles);
    } finally {
      setLoadingCells((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  return (
    <div>
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
            <Clock size={14} /> Pendientes de confirmar email ({pendingUsers.length})
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Se registraron pero todavía no confirmaron su correo — no pueden recibir roles hasta que lo hagan.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl overflow-hidden divide-y divide-amber-100 dark:divide-amber-800/50">
            {pendingUsers.map((pendingUser) => (
              <div key={pendingUser.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {pendingUser.email}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Registrado el{' '}
                    {new Date(pendingUser.created_at).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleResend(pendingUser)}
                  disabled={resendingId === pendingUser.id}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-3 py-1.5 rounded-xl transition disabled:opacity-50 shrink-0"
                >
                  <Mail size={12} />
                  {resendingId === pendingUser.id ? 'Enviando…' : 'Reenviar correo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Click en una celda para asignar o quitar roles
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-[260px_repeat(auto-fit,minmax(90px,1fr))] bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
            Usuario
          </div>
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center uppercase tracking-wide"
            >
              {role.name}
            </div>
          ))}
        </div>

        {/* BODY */}
        {profiles.map((profileUser, index) => {
          const rolesDelUsuario = userRoleMap.get(profileUser.id) || new Set();
          const banned = isBanned(profileUser.id);
          const isSelf = profileUser.id === user?.id;
          const isProtected = profileUser.email === PROTECTED_EMAIL;

          return (
            <motion.div
              key={profileUser.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="grid grid-cols-[260px_repeat(auto-fit,minmax(90px,1fr))] border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* USER */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                  {profileUser.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {profileUser.email}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                    {profileUser.id.slice(0, 6)}
                    {banned && (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        · Desactivado
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    banned ? handleReactivate(profileUser) : setDeactivatingUser(profileUser)
                  }
                  disabled={togglingId === profileUser.id || isSelf || isProtected}
                  title={
                    isProtected
                      ? 'Es el superadmin de la plataforma, no se puede desactivar'
                      : isSelf
                        ? 'No podés desactivar tu propia cuenta'
                        : undefined
                  }
                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                    banned
                      ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                  }`}
                >
                  {banned ? <UserCheck size={12} /> : <UserX size={12} />}
                  {togglingId === profileUser.id ? '…' : banned ? 'Reactivar' : 'Desactivar'}
                </button>
              </div>

              {/* CELLS */}
              {roles.map((role) => {
                const active = rolesDelUsuario.has(role.id);
                const key = `${profileUser.id}-${role.id}`;
                const isLoading = loadingCells.has(key);

                return (
                  <div key={role.id} className="flex items-center justify-center p-4">
                    <motion.div
                      onClick={() => toggleRole(profileUser.id, role.id)}
                      whileTap={{ scale: 0.85 }}
                      className={`
                        w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                        transition-all cursor-pointer select-none
                        ${active
                          ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 ring-1 ring-green-500/30'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      {isLoading ? '·' : active ? '✓' : ''}
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deactivatingUser}
        title="¿Desactivar usuario?"
        message={`"${deactivatingUser?.email ?? ''}" ya no podrá iniciar sesión hasta que lo reactives.`}
        confirmLabel="Desactivar"
        confirmClassName="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivatingUser(null)}
      />
    </div>
  );
};

export default Users;