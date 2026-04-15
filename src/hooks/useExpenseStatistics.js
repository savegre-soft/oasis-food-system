import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export const useExpenseStatistics = ({ from, to }) => {
  const { supabase } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [empCosts, setEmpCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) return;

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
            .select('expense_date, amount, category_id, description, expense_categories(name)')
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

  return { expenses, empCosts, loading, error };
};
