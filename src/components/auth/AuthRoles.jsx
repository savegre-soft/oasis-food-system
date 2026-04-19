import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const AuthRoles = ({ rolesNames = [], children }) => {
  const { supabase, user } = useApp();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: roles, error: rolesError } = await supabase
          .schema('operations')
          .from('Roles')
          .select('*');
        if (rolesError) throw rolesError;

        const { data: userRoles, error: rolesUsersError } = await supabase
          .schema('operations')
          .from('userRoles')
          .select('*')
          .eq('userId', user.id);
        if (rolesUsersError) throw rolesUsersError;

        const userRoleIds = userRoles.map((ur) => ur.rolId);
        const userRoleNames = roles
          .filter((r) => userRoleIds.includes(r.id))
          .map((r) => r.name.trim());

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl mb-3">🔒</span>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          No tienes permisos para ver este contenido
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Roles requeridos: {rolesNames.join(', ')}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRoles;