import PaymentAdd from "./payment/PaymentAdd";
import PaymentTable from "./payment/PaymentTable";

const PaymentSection = () => {
  return (
    <div className="bg-white  rounded-2xl p-6 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pagos</p>
    <PaymentAdd/>
    <PaymentTable items={[]}/>
    </div>
  );
};

export default PaymentSection;
