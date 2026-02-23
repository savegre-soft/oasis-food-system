import { useState } from "react";
import { Plus, Trash2, CalendarDays, Users } from "lucide-react";

const Menus = () => {
  const [vista, setVista] = useState("semanal");

  const [menuSemanal, setMenuSemanal] = useState([
    { id: 1, dia: "Lunes", plato: "Arroz con pollo" },
    { id: 2, dia: "Martes", plato: "Carne en salsa" },
  ]);

  const [menuFamiliar, setMenuFamiliar] = useState([
    { id: 1, tipo: "Almuerzo", plato: "Lasagna familiar" },
    { id: 2, tipo: "Cena", plato: "Tacos familiares" },
  ]);

  const [nuevoPlato, setNuevoPlato] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState("Lunes");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("Almuerzo");

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const agregarMenuSemanal = () => {
    if (!nuevoPlato) return;
    setMenuSemanal([
      ...menuSemanal,
      {
        id: Date.now(),
        dia: diaSeleccionado,
        plato: nuevoPlato,
      },
    ]);
    setNuevoPlato("");
  };

  const agregarMenuFamiliar = () => {
    if (!nuevoPlato) return;
    setMenuFamiliar([
      ...menuFamiliar,
      {
        id: Date.now(),
        tipo: tipoSeleccionado,
        plato: nuevoPlato,
      },
    ]);
    setNuevoPlato("");
  };

  const eliminarSemanal = (id) => {
    setMenuSemanal(menuSemanal.filter((m) => m.id !== id));
  };

  const eliminarFamiliar = (id) => {
    setMenuFamiliar(menuFamiliar.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Gestión de Menús
        </h1>
        <p className="text-slate-500 mt-2">
          Crea y administra menús semanales y familiares
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setVista("semanal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            vista === "semanal"
              ? "bg-white shadow text-slate-800"
              : "text-slate-600"
          }`}
        >
          <CalendarDays size={16} />
          Plan Semanal
        </button>

        <button
          onClick={() => setVista("familiar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            vista === "familiar"
              ? "bg-white shadow text-slate-800"
              : "text-slate-600"
          }`}
        >
          <Users size={16} />
          Familiar
        </button>
      </div>

      {/* ================= PLAN SEMANAL ================= */}
      {vista === "semanal" && (
        <>
          {/* Formulario */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
            <h2 className="font-semibold text-slate-800 mb-4">
              Agregar Menú Semanal
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <select
                value={diaSeleccionado}
                onChange={(e) => setDiaSeleccionado(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl"
              >
                {dias.map((dia) => (
                  <option key={dia}>{dia}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Nombre del plato"
                value={nuevoPlato}
                onChange={(e) => setNuevoPlato(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl"
              />

              <button
                onClick={agregarMenuSemanal}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition"
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-4">
            {menuSemanal.map((menu) => (
              <div
                key={menu.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-slate-400">{menu.dia}</p>
                  <p className="font-semibold text-slate-800">
                    {menu.plato}
                  </p>
                </div>

                <button
                  onClick={() => eliminarSemanal(menu.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= PLAN FAMILIAR ================= */}
      {vista === "familiar" && (
        <>
          {/* Formulario */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
            <h2 className="font-semibold text-slate-800 mb-4">
              Agregar Menú Familiar
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <select
                value={tipoSeleccionado}
                onChange={(e) => setTipoSeleccionado(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl"
              >
                <option>Almuerzo</option>
                <option>Cena</option>
              </select>

              <input
                type="text"
                placeholder="Nombre del plato"
                value={nuevoPlato}
                onChange={(e) => setNuevoPlato(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl"
              />

              <button
                onClick={agregarMenuFamiliar}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition"
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-4">
            {menuFamiliar.map((menu) => (
              <div
                key={menu.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-slate-400">{menu.tipo}</p>
                  <p className="font-semibold text-slate-800">
                    {menu.plato}
                  </p>
                </div>

                <button
                  onClick={() => eliminarFamiliar(menu.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Menus;