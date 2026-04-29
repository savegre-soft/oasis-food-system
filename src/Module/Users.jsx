import { useApp } from '../context/AppContext';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const Users = () => {
  const { supabase } = useApp();

  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loadingCells, setLoadingCells] = useState(new Set());

  async function GetUserRoles() {
    const { data, error } = await supabase.schema('operations').from('userRoles').select('*');
    if (error) return console.error(error);
    setUserRoles(data || []);
  }

  async function GetRoles() {
    const { data, error } = await supabase.schema('operations').from('Roles').select('*');
    if (error) return console.error(error);
    setRoles(data || []);
  }

  async function GetUsers() {
    const { data, error } = await supabase.schema('operations').from('profiles').select('*');
    if (error) return console.error(error);
    setProfiles(data || []);
  }

  useEffect(() => {
    GetUsers();
    GetRoles();
    GetUserRoles();
  }, []);

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
        {profiles.map((user, index) => {
          const rolesDelUsuario = userRoleMap.get(user.id) || new Set();

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="grid grid-cols-[260px_repeat(auto-fit,minmax(90px,1fr))] border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* USER */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {user.email}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {user.id.slice(0, 6)}
                  </div>
                </div>
              </div>

              {/* CELLS */}
              {roles.map((role) => {
                const active = rolesDelUsuario.has(role.id);
                const key = `${user.id}-${role.id}`;
                const isLoading = loadingCells.has(key);

                return (
                  <div key={role.id} className="flex items-center justify-center p-4">
                    <motion.div
                      onClick={() => toggleRole(user.id, role.id)}
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
    </div>
  );
};

export default Users;