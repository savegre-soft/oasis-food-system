import { useState } from 'react';
import { STATUS_CONFIG, DAY_LABELS } from '../utils/customerUtils';

import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

// Current week view — active orders
const CurrentWeekView = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No hay órdenes activas esta semana</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderBlock key={order.id_order} order={order} />
      ))}
    </div>
  );
};

export default CurrentWeekView;
