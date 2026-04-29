import Users from '../Module/Users';
import AddUser from '../components/user/AddUser';
import Modal from '../components/Modal';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

const Settings = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Add modal */}
      <AnimatePresence mode="wait">
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
            }}
          >
            <AddUser onClose={() => setShowModal(false)} />
          </Modal>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
              Configuración
            </h1>
            <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
              Administra usuarios y preferencias del sistema
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Agregar Usuario
          </button>
        </div>

        {/* Users Table/List Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-4">
              Usuarios registrados
            </h2>
            <Users />
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;