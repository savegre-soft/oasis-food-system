import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { useApp } from '../context/AppContext';

export default function MainLayout() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full p-2 pt-6 pb-16">
        <Outlet />
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-green-800 dark:bg-green-950 text-center p-3 text-sm text-white z-50 shadow-md transition-colors duration-300">
        © 2026 Oasis Food System. All rights reserved.
      </footer>
    </div>
  );
}