import { useEffect, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatePresence } from 'framer-motion';

import Modal from './../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AddTemplate from '../components/AddTemplate';
import TemplateCard from '../components/TemplateCard';

const Templates = () => {
  const { supabase } = useApp();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // ===============================
  // OBTENER DATOS
  // ===============================
  const getData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema('operations')
      .from('order_templates')
      .select(
        `
        id_template,
        name,
        description,
        meal_type,
        is_active,
        order_template_days (
          id_template_day,
          day_of_week,
          order_template_details (
            id_template_detail,
            recipe_id,
            quantity,
            recipes (
              id_recipe,
              name
            )
          )
        )
      `
      )
      .eq('is_active', true)
      .order('id_template', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  // ===============================
  // ELIMINAR (soft delete)
  // ===============================
  const eliminar = async (id) => {
    const { error } = await supabase
      .schema('operations')
      .from('order_templates')
      .update({ is_active: false })
      .eq('id_template', id);

    if (error) {
      console.error(error);
      return;
    }

    getData();
  };

  return (
    <>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar menú?"
        message="Se eliminará el menú y todos sus días y recetas."
        onConfirm={() => {
          eliminar(toDelete);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />

      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              getData();
            }}
          >
            <AddTemplate
              onSuccess={() => {
                setShowModal(false);
                getData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTemplate && (
          <Modal isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)}>
            <AddTemplate
              initialData={editingTemplate}
              onSuccess={() => {
                setEditingTemplate(null);
                getData();
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Menús</h1>
            <p className="text-slate-500 mt-2">Crea y administra menús semanales reutilizables</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition text-sm font-medium"
          >
            <LayoutTemplate size={16} />
            Nuevo Menú
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <LayoutTemplate size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay menús registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id_template}
                template={template}
                onDelete={setToDelete}
                onEdit={setEditingTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Templates;
