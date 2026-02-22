import { NavLink } from "react-router-dom"
import { Home, Users, ShoppingCart } from "lucide-react"

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/Clientes", label: "Clientes", icon: Users },
  { to: "/Pedidos", label: "Pedidos", icon: ShoppingCart },
]

export default function Navbar() {
  const baseStyle =
    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
        
        {/* Título */}
        <h1 className="text-lg font-bold tracking-wide">
          MiApp
        </h1>

        {/* Menú */}
        <div className="flex gap-3">
          {links.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
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
            )
          })}
        </div>

      </div>
    </nav>
  )
}