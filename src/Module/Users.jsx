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
    const { data, error } = await supabase
      .schema('operations')
      .from('userRoles')
      .select('*');

    if (error) return console.error(error);
    setUserRoles(data || []);
  }

  async function GetRoles() {
    const { data, error } = await supabase
      .schema('operations')
      .from('Roles')
      .select('*');

    if (error) return console.error(error);
    setRoles(data || []);
  }

  async function GetUsers() {
    const { data, error } = await supabase
      .schema('operations')
      .from('profiles')
      .select('*');

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
      if (!map.has(ur.userId)) {
        map.set(ur.userId, new Set());
      }
      map.get(ur.userId).add(ur.rolId);
    });

    return map;
  }, [userRoles]);

  // 🔥 TOGGLE ROLE
  const toggleRole = async (userId, roleId) => {
    const key = `${userId}-${roleId}`;

    if (loadingCells.has(key)) return;

    const currentRoles = userRoleMap.get(userId) || new Set();
    const hasRole = currentRoles.has(roleId);

    // 🔹 optimistic update
    let newUserRoles;

    if (hasRole) {
      newUserRoles = userRoles.filter(
        (ur) => !(ur.userId === userId && ur.rolId === roleId)
      );
    } else {
      newUserRoles = [...userRoles, { userId, rolId: roleId }];
    }

    setUserRoles(newUserRoles);
    setLoadingCells((prev) => new Set(prev).add(key));

    try {
      if (hasRole) {
        // DELETE
        const { error } = await supabase
          .schema('operations')
          .from('userRoles')
          .delete()
          .match({ userId, rolId: roleId });

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .schema('operations')
          .from('userRoles')
          .insert({ userId, rolId: roleId });

        if (error) throw error;
      }
    } catch (error) {
      console.error(error);

      // ❌ rollback
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-gray-800">
            Permisos de Usuarios
          </h2>
          <p className="text-gray-500 text-sm">
            Click en una celda para asignar o quitar roles
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* HEADER */}
          <div className="grid grid-cols-[260px_repeat(auto-fit,minmax(90px,1fr))] bg-gray-50 border-b">
            <div className="p-4 text-sm font-medium text-gray-600">
              Usuario
            </div>

            {roles.map((role) => (
              <div
                key={role.id}
                className="p-4 text-xs font-semibold text-gray-500 text-center uppercase"
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
                className="grid grid-cols-[260px_repeat(auto-fit,minmax(90px,1fr))] border-b hover:bg-gray-50"
              >
                {/* USER */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-400">
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
                    <div
                      key={role.id}
                      className="flex items-center justify-center p-4"
                    >
                      <motion.div
                        onClick={() => toggleRole(user.id, role.id)}
                        whileTap={{ scale: 0.85 }}
                        className={`
                          w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                          transition-all cursor-pointer
                          ${
                            active
                              ? 'bg-green-500/10 text-green-600 ring-1 ring-green-500/20'
                              : 'bg-gray-100 text-gray-300'
                          }
                          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                        `}
                      >
                        {isLoading ? '...' : active ? '✓' : ''}
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Users;