const PaymentTable = ({ items }) => {
  console.log(items);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr className="text-left text-sm text-gray-600">
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Notas</th>
            <th className="px-4 py-2">Monto</th>
            <th className="px-4 py-2">TipoId</th>
            <th className="px-4 py-2">Cliente</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-4 text-gray-400">
                No hay pagos
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-t text-sm hover:bg-gray-50 transition">
                <td className="px-4 py-2">{new Date(item.created_at).toLocaleString()}</td>

                <td className="px-4 py-2">{item.Note}</td>

                <td className="px-4 py-2 font-medium">₡ {Number(item.Amount).toLocaleString()}</td>

                <td className="px-4 py-2">{item.PaymentsType.name}</td>

                <td className="px-4 py-2">{item.ClientId}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;
