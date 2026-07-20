import { useState } from 'react';
import { Calendar, History } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import ComboOrdersTab from '../components/combos/ComboOrdersTab';
import ComboHistoryView from '../components/combos/ComboHistoryView';

const TABS = [
  { id: 'week', label: 'Semana', Icon: Calendar },
  { id: 'history', label: 'Historico', Icon: History },
];

const Combos = () => {
  const [activeTab, setActiveTab] = useState('week');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Combos</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configura el combo semanal y gestiona los pedidos de los clientes
        </p>
      </div>

      {/* Tabs Principales */}
      <div className="flex items-center gap-1 mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 w-fit shadow-sm">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const cls =
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ' +
            (active
              ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200');
          return (
            <button key={id} onClick={() => setActiveTab(id)} className={cls}>
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'week' && (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ComboOrdersTab />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ComboHistoryView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Combos;
