import { Outlet } from 'react-router-dom';
import PublicNavBar from '../components/PublicNavBar';
import PublicFooter from '../components/public/PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-oasis-cream text-oasis-ink">
      <PublicNavBar />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}
