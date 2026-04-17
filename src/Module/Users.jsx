import { User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useEffect, useState } from 'react';

const Users = () => {
  const { supabase } = useApp();
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);

  async function GetUserRoles() {
    try {
      const { data: userRolesData, error: userRolesError } = await supabase
        .schema('operations')
        .from('userRoles')
        .select('*');

      if (userRolesError) throw userRolesError;
    } catch (error) {
      console.error(error);
    }
  }

  async function GetRoles() {
    try {
      const { data: dataRoles, error: errorRoles } = await supabase
        .schema('operations')
        .from('Roles')
        .select('*');

      if (errorRoles) throw errorRoles;

      setRoles(dataRoles);
    } catch (error) {
      console.error(error);
    }
  }

  async function GetUsers() {
    try {
      const { data, error } = await supabase.schema('operations').from('profiles').select('*');

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    GetUsers();
    GetRoles();
  }, []);

  return (
    <div className="border rounded m-2 shadow border-gray-100 p-3">
      <h3 className="text-2xl mb-4">Lista de Usuarios</h3>

      {profiles.length === 0 ? (
        <p className="text-gray-500">No hay usuarios</p>
      ) : (
        <div className="flex flex-col gap-2">
          {profiles.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
            >
              <User className="w-5 h-5 text-gray-500" />

              <div className="flex flex-col">
                <span className="font-medium">{user.email}</span>
                <span className="text-sm text-gray-500">Rol: {user.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
