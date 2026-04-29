import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

/**
 * @typedef {Object} ExpenseCategory
 * @property {string} name - Nombre de la categoría
 */

/**
 * @typedef {Object} Expense
 * @property {string} expense_date - Fecha del gasto (YYYY-MM-DD)
 * @property {number} amount - Monto del gasto
 * @property {number|string} category_id - ID de la categoría
 * @property {string} description - Descripción del gasto
 * @property {ExpenseCategory|null} expense_categories - Relación con categoría
 */

/**
 * @typedef {Object} EmployeeCost
 * @property {string} WorkDate - Fecha de trabajo (YYYY-MM-DD)
 * @property {number} Amount - Costo
 * @property {string} Name - Nombre del empleado
 * @property {number} Hours - Horas trabajadas
 */

/**
 * Hook para obtener estadísticas de gastos:
 * - Gastos operativos (expenses)
 * - Costos de empleados (empCost)
 *
 * Ejecuta consultas en paralelo y filtra por rango de fechas.
 *
 * @param {{ from: string, to: string }} params
 *
 * @returns {{
 *  expenses: Expense[],
 *  empCosts: EmployeeCost[],
 *  loading: boolean,
 *  error: string|null
 * }}
 */
export const useExpenseStatistics = ({ from, to }) => {
  const { supabase } = useApp();

  /** @type {[Expense[], Function]} */
  const [expenses, setExpenses] = useState([]);

  /** @type {[EmployeeCost[], Function]} */
  const [empCosts, setEmpCosts] = useState([]);

  /** @type {[boolean, Function]} */
  const [loading, setLoading] = useState(true);

  /** @type {[string|null, Function]} */
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;

    /**
     * Ejecuta fetch paralelo de gastos y costos de empleados
     */
    const run = async () => {
      try {
        setLoading(true);

        const [
          { data: expData, error: expError },
          { data: empData, error: empError },
        ] = await Promise.all([
          supabase
            .schema('operations')
            .from('expenses')
            .select(
              'expense_date, amount, category_id, description, expense_categories(name)'
            )
            .gte('expense_date', from)
            .lte('expense_date', to)
            .order('expense_date'),

          supabase
            .schema('operations')
            .from('empCost')
            .select('WorkDate, Amount, Name, Hours')
            .gte('WorkDate', from)
            .lte('WorkDate', to)
            .order('WorkDate'),
        ]);

        if (expError) throw expError;
        if (empError) throw empError;

        setExpenses(expData || []);
        setEmpCosts(empData || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [from, to, supabase]);

  return {
    expenses,
    empCosts,
    loading,
    error,
  };
};