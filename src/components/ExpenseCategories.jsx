import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { sileo } from 'sileo';
import { useApp } from '../context/AppContext';

const ExpenseCategories = () => {
  const { supabase } = useApp();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .schema('operations')
      .from('expense_categories')
      .select('*')
      .order('name');
    if (error) {
      sileo.error('No se pudieron cargar las categorías de gasto');
    } else {
      setCategories(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSaving(true);
    const { error } = await supabase
      .schema('operations')
      .from('expense_categories')
      .insert({ name: trimmed, is_active: true });
    if (error) {
      sileo.error('No se pudo crear la categoría');
    } else {
      setNewName('');
      setAdding(false);
      await fetchCategories();
    }
    setSaving(false);
  };

  const handleEdit = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setSaving(true);
    const { error } = await supabase
      .schema('operations')
      .from('expense_categories')
      .update({ name: trimmed })
      .eq('id_expense_category', id);
    if (error) {
      sileo.error('No se pudo renombrar la categoría');
    } else {
      setEditingId(null);
      setEditingName('');
      await fetchCategories();
    }
    setSaving(false);
  };

  const handleToggleActive = async (cat) => {
    const { error } = await supabase
      .schema('operations')
      .from('expense_categories')
      .update({ is_active: !cat.is_active })
      .eq('id_expense_category', cat.id_expense_category);
    if (error) {
      sileo.error('No se pudo cambiar el estado de la categoría');
    } else {
      setCategories((prev) =>
        prev.map((c) =>
          c.id_expense_category === cat.id_expense_category
            ? { ...c, is_active: !c.is_active }
            : c
        )
      );
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id_expense_category);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add row */}
      {adding ? (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            placeholder="Nombre de la categoría"
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            <Check size={14} />
            Guardar
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 transition"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <Plus size={15} />
          Nueva categoría
        </button>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-5 py-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Nombre
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center w-24">
            Estado
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center w-20">
            Acciones
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-sm">
            No hay categorías registradas
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {categories.map((cat) => (
              <div
                key={cat.id_expense_category}
                className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                {/* Name */}
                <div>
                  {editingId === cat.id_expense_category ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(cat.id_expense_category);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="px-3 py-1.5 border border-indigo-300 dark:border-indigo-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                      />
                      <button
                        type="button"
                        onClick={() => handleEdit(cat.id_expense_category)}
                        disabled={saving}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition disabled:opacity-50"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 transition"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm font-medium ${cat.is_active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                      {cat.name}
                    </p>
                  )}
                </div>

                {/* Status toggle */}
                <div className="flex justify-center w-24">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                      cat.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </button>
                </div>

                {/* Edit action */}
                <div className="flex justify-center w-20">
                  {editingId !== cat.id_expense_category && (
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategories;
