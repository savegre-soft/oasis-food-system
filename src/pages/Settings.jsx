import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Users from '../Module/Users';
import AddUser from '../components/user/AddUser';
import Modal from '../components/Modal';
import AuthRoles from '../components/auth/AuthRoles';
import ExpenseCategories from '../components/ExpenseCategories';

const TABS = [
  { id: 'users', label: 'Usuarios' },
  { id: 'expense_categories', label: 'Categorías de gastos' },
];

const Settings = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  return (
    <>
      <AnimatePresence mode="wait">
        {showModal && (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <AddUser onClose={() => setShowModal(false)} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
              Configuración
            </h1>
            <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
              Administra usuarios y preferencias del sistema
            </p>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Usuario
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-4">
                Usuarios registrados
              </h2>
              <Users />
            </div>
          </div>
        )}

        {activeTab === 'expense_categories' && (
          <AuthRoles rolesNames={['Administrador']}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                    Categorías de gastos
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Administra las categorías disponibles para clasificar gastos
                  </p>
                </div>
                <ExpenseCategories />
              </div>
            </div>
          </AuthRoles>
        )}
      </div>
    </>
  );
};

export default Settings;
