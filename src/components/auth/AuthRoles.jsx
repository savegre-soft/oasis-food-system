import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const AuthRoles = ({ rolesNames = [], children }) => {
  const { supabase, user } = useApp();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Obtener todos los roles
        const { data: roles, error: rolesError } = await supabase
          .schema('operations')
          .from('Roles')
          .select('*');
        if (rolesError) throw rolesError;

        // Obtener roles del usuario
        const { data: userRoles, error: rolesUsersError } = await supabase
          .schema('operations')
          .from('userRoles')
          .select('*')
          .eq('userId', user.id);
        if (rolesUsersError) throw rolesUsersError;

        // IDs de roles que tiene el usuario
        const userRoleIds = userRoles.map((ur) => ur.rolId);

        // Nombres de roles que tiene el usuario
        const userRoleNames = roles
          .filter((r) => userRoleIds.includes(r.id))
          .map((r) => r.name.trim());

        // Verificar si alguno de los roles requeridos coincide
        const allowed = rolesNames.some((name) => userRoleNames.includes(name));
        setHasAccess(allowed);
      } catch (error) {
        console.error(error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) checkAccess();
  }, [user]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl mb-3">🔒</span>
        <p className="text-gray-600 font-medium">No tienes permisos para ver este contenido</p>
        <p className="text-gray-400 text-sm mt-1">Roles requeridos: {rolesNames.join(', ')}</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRoles;
