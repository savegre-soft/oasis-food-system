import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  ShoppingCart,
  RouteIcon,
  Menu,
  X,
  DollarSign,
  User,
  LogOut,
} from "lucide-react";

const links = [
  { to: "/Main", label: "Home", icon: Home },
  { to: "/Clientes", label: "Clientes", icon: Users },
  { to: "/entregas", label: "Entregas", icon: RouteIcon },
  { to: "/Pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/Gastos", label: "Gastos", icon: DollarSign },
];

export default function Navbar() {
  const nav = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  function handleLogout() {
    setProfileOpen(false);
    setIsOpen(false);

    // Si usas token:
    // localStorage.removeItem("token");

    alert("Sesión cerrada");
    nav("/login");
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseStyle =
    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2";

  return (
    <nav className="sticky top-0 z-50 bg-green-800/95 backdrop-blur-md text-white shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <h1 className="text-lg font-bold tracking-wide">Oasis Food</h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${baseStyle} ${
                    isActive
                      ? "bg-white text-green-800 shadow-md"
                      : "hover:bg-green-700 hover:scale-105"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-2 rounded-full hover:bg-green-700 transition"
            >
              <User size={22} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-white text-green-800 rounded-xl shadow-xl py-2">
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-100 transition">
                  <User size={16} />
                  Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-100 text-red-600 transition"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-green-700 transition"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-2 bg-green-800">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `${baseStyle} ${
                    isActive
                      ? "bg-white text-green-800"
                      : "hover:bg-green-700"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}

          <div className="border-t border-green-700 pt-3 mt-3">
            <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-700 transition">
              <User size={18} />
              Perfil
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-100 text-red-600 transition"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}