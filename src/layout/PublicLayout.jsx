import { Outlet } from 'react-router-dom';
import PublicNavBar from '../components/PublicNavBar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 text-slate-800">
      <PublicNavBar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-10">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white text-center py-6 text-sm shadow-inner">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-medium">© {new Date().getFullYear()} Oasis Food</p>
          <p className="text-emerald-100 text-xs mt-1">Sabor fresco todos los días 🌿</p>
        </div>
      </footer>
    </div>
  );
}
