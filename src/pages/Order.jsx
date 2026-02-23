import { useState } from "react";

const Order = () => {
  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [total, setTotal] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!cliente || !direccion || !total) {
      alert("Completa todos los campos");
      return;
    }

    alert("Pedido guardado correctamente");
    setCliente("");
    setDireccion("");
    setMetodoPago("Efectivo");
    setTotal("");
  }

  return (
    <div className="min-h-2/3 bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-10 rounded-xl shadow-md">
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-8 border-b pb-3">
          Crear Pedido
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Método de pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-green-600"
            >
              <option>Efectivo</option>
              <option>Sinpe</option>
              <option>Tarjeta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Total (₡)
            </label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-green-600"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-md transition"
            >
              Guardar Pedido
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Order;