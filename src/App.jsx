import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sileo';

// Los layouts (shell de la app) se cargan de forma ansiosa para evitar un
// parpadeo al navegar; las páginas se parten en chunks con React.lazy para que
// un visitante del sitio público NO descargue toda la app admin (Leaflet,
// Recharts, Supabase y las páginas de operación viven ahora en chunks aparte).
import MainLayout from './layout/MainLayout';
import PublicLayout from './layout/PublicLayout';
import PortalLayout from './layout/PortalLayout';

// Páginas públicas
const Home = lazy(() => import('./pages/Homes'));
const Menu = lazy(() => import('./pages/Menu'));
const Contact = lazy(() => import('./pages/contact'));
const Promotions = lazy(() => import('./pages/Promotions'));
const WellShot = lazy(() => import('./pages/WellShot'));
const Catering = lazy(() => import('./pages/Catering'));
const PublicAbout = lazy(() => import('./pages/PublicAbout'));
const PoliticaPrivacidad = lazy(() => import('./pages/PoliticaPrivacidad'));
const Order = lazy(() => import('./pages/Order'));

// Auth y portal
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));

// Páginas privadas (admin / operación)
const About = lazy(() => import('./pages/About'));
const Customers = lazy(() => import('./pages/customers'));
const Main = lazy(() => import('./pages/Main'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const DeliveriesExpress = lazy(() => import('./pages/DeliveriesExpress'));
const DeliveriesCombos = lazy(() => import('./pages/DeliveriesCombos'));
const Bills = lazy(() => import('./pages/Bills'));
const Menus = lazy(() => import('./pages/Menus'));
const Settings = lazy(() => import('./pages/Settings'));
const Routes_page = lazy(() => import('./pages/Routes'));
const Templates = lazy(() => import('./pages/Templates'));
const Customer = lazy(() => import('./pages/customer'));
const Orders = lazy(() => import('./pages/Orders'));
const ExpenseStadistic = lazy(() => import('./pages/ExpenseStadistic'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const Payments = lazy(() => import('./pages/Payments'));
const Profile = lazy(() => import('./pages/Profile'));
const Planilla = lazy(() => import('./pages/Planilla'));
const ComboItems = lazy(() => import('./pages/ComboItems'));
const Combos = lazy(() => import('./pages/Combos'));
const BulkDishes = lazy(() => import('./pages/BulkDishes'));
const BulkSales = lazy(() => import('./pages/BulkSales'));
const Prospects = lazy(() => import('./pages/Prospects'));
const PromotionsAdmin = lazy(() => import('./pages/PromotionsAdmin'));

// Fallback mientras se descarga el chunk de una ruta.
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-oasis-cream">
    <div
      role="status"
      aria-label="Cargando"
      className="w-9 h-9 rounded-full border-2 border-oasis-olive-200 border-t-oasis-olive-600 animate-spin"
    />
  </div>
);

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/about" element={<About />} />
              <Route path="/Clientes" element={<Customers />} />
              <Route path="/main" element={<Main />} />
              <Route path="/entregas" element={<Deliveries />} />
              <Route path="/entregas/express" element={<DeliveriesExpress />} />
              <Route path="/entregas/combos" element={<DeliveriesCombos />} />
              <Route path="/gastos" element={<Bills />} />
              <Route path="/menus" element={<Menus />} />
              <Route path="/cliente/:id" element={<Customer />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/routes" element={<Routes_page />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/combo-items" element={<ComboItems />} />
              <Route path="/ventas-masivas" element={<BulkSales />} />
              <Route path="/platos-venta-masiva" element={<BulkDishes />} />

              <Route path="/orders" element={<Orders />} />
              <Route path="/combos" element={<Combos />} />
              <Route path="/prospectos" element={<Prospects />} />
              <Route path="/promociones-admin" element={<PromotionsAdmin />} />
              <Route path="/control-gastos" element={<ExpenseStadistic />} />
              <Route path="/pagos" element={<Payments />} />
              <Route path="/empleados" element={<Navigate to="/planilla" replace />} />
              <Route path="/estadisticas" element={<Estadisticas />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/planilla" element={<Planilla />} />
            </Route>
            <Route element={<PublicLayout />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/" element={<Home />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/promociones" element={<Promotions />} />
              <Route path="/ordenar" element={<Order />} />
              <Route path="/well-shot" element={<WellShot />} />
              <Route path="/catering" element={<Catering />} />
              <Route path="/nosotros" element={<PublicAbout />} />
              <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
            </Route>
            <Route element={<PortalLayout />}>
              <Route path="/portal/:token" element={<CustomerPortal />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="bottom-right" className="z-50" />
    </>
  );
}
