import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Home from './pages/Homes';
import About from './pages/About';
import Test from './pages/Test';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Menu from './pages/Menu';
import PublicLayout from './layout/PublicLayout';
import Main from './pages/Main';
import Contact from './pages/contact';
import Promotions from './pages/Promotions';
import Customers from './pages/customers';
import Order from './pages/Order';
import Deliveries from './pages/Deliveries';
import Bills from './pages/Bills';
import Menus from './pages/Menus';
import Settings from './pages/Settings';
import Recipes from './pages/Recipes';
import Routes_page from './pages/Routes';
import ResetPassword from './pages/ResetPassword';
import Templates from './pages/Templates';
import Customer from './pages/customer';
import Orders from './pages/Orders';
import ExpenseEmployees from './pages/ExpenseEmployees';
import ExpenseStadistic from './pages/ExpenseStadistic';
import Estadisticas from './pages/Estadisticas';
import ChangePassword from './pages/ChangePassword';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import { sileo, Toaster } from 'sileo';

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/about" element={<About />} />
            <Route path="/Pedidos" element={<Test />} />
            <Route path="/Clientes" element={<Customers />} />
            <Route path="/main" element={<Main />} />
            <Route path="/entregas" element={<Deliveries />} />
            <Route path="/gastos" element={<Bills />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/cliente/:id" element={<Customer />} />
            <Route path="/recetas" element={<Recipes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/routes" element={<Routes_page />} />
            <Route path="/templates" element={<Templates />} />

            <Route path="/orders" element={<Orders />} />
            <Route path="/control-gastos" element={<ExpenseStadistic />} />
            <Route path="/pagos" element={<Payments />} />
            <Route path="/empleados" element={<ExpenseEmployees />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route element={<PublicLayout />}>
            <Route path="/menu" element={<Menu />} />
            <Route path="/" element={<Home />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/promociones" element={<Promotions />} />
            <Route path="/ordenar" element={<Order />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/ChangePassword/*" element={<ChangePassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" className="z-50" />
    </>
  );
}
