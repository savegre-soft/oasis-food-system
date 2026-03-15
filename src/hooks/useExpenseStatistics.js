import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { sileo } from "sileo";

/* =========================
   FORMATEAR FECHA PARA SUPABASE
========================= */

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 10);
};

export const useExpenseStatistics = (dateRange) => {
  const { supabase } = useApp();

  const [lineData, setLineData] = useState([]);
  const [employeeLineData, setEmployeeLineData] = useState([]);
  const [pieData, setPieData] = useState([]);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalEmployeeCost, setTotalEmployeeCost] = useState(0);

  const [expenseCount, setExpenseCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

  const getData = async () => {
    try {

      const start = formatDate(dateRange?.startDate);
      const end = formatDate(dateRange?.endDate);

      /* =========================
         QUERY GASTOS
      ========================= */

      let expensesQuery = supabase
        .schema("operations")
        .from("expenses")
        .select("expense_date, amount, category_id")
        .order("expense_date");

      /* =========================
         QUERY EMPLEADOS
      ========================= */

      let empQuery = supabase
        .schema("operations")
        .from("empCost")
        .select("WorkDate, Amount")
        .order("WorkDate");

      if (start) {
        expensesQuery = expensesQuery.gte("expense_date", start);
        empQuery = empQuery.gte("WorkDate", start);
      }

      if (end) {
        expensesQuery = expensesQuery.lte("expense_date", end);
        empQuery = empQuery.lte("WorkDate", end);
      }

      const { data: expensesData, error: expensesError } = await expensesQuery;
      const { data: empData, error: empError } = await empQuery;

      if (expensesError || empError) throw expensesError || empError;

      /* =========================
         GASTOS POR DIA
      ========================= */

      const expenseMap = {};

      expensesData.forEach((exp) => {
        if (!expenseMap[exp.expense_date]) expenseMap[exp.expense_date] = 0;
        expenseMap[exp.expense_date] += exp.amount;
      });

      setLineData(
        Object.entries(expenseMap).map(([date, total]) => ({
          date,
          total,
        }))
      );

      /* =========================
         EMPLEADOS POR DIA
      ========================= */

      const empMap = {};

      empData.forEach((emp) => {
        if (!empMap[emp.WorkDate]) empMap[emp.WorkDate] = 0;
        empMap[emp.WorkDate] += emp.Amount;
      });

      setEmployeeLineData(
        Object.entries(empMap).map(([date, total]) => ({
          date,
          total,
        }))
      );

      /* =========================
         TOTALES
      ========================= */

      const totalExp = expensesData.reduce(
        (acc, item) => acc + item.amount,
        0
      );

      setTotalExpenses(totalExp);
      setExpenseCount(expensesData.length);

      const totalEmp = empData.reduce(
        (acc, item) => acc + item.Amount,
        0
      );

      setTotalEmployeeCost(totalEmp);
      setEmployeeCount(empData.length);

      /* =========================
         CATEGORIAS
      ========================= */

      let categoryQuery = supabase
        .schema("operations")
        .from("expenses")
        .select(`
          amount,
          expense_categories (
            name
          )
        `);

      if (start) categoryQuery = categoryQuery.gte("expense_date", start);
      if (end) categoryQuery = categoryQuery.lte("expense_date", end);

      const { data: categoryData, error: categoryError } =
        await categoryQuery;

      if (categoryError) throw categoryError;

      const categoryMap = {};

      categoryData.forEach((exp) => {
        const name = exp.expense_categories?.name || "Otros";

        if (!categoryMap[name]) categoryMap[name] = 0;
        categoryMap[name] += exp.amount;
      });

      setPieData(
        Object.entries(categoryMap).map(([name, value]) => ({
          name,
          value,
        }))
      );

    } catch (error) {
      sileo.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, [dateRange]);

  return {
    lineData,
    employeeLineData,
    pieData,
    totalExpenses,
    totalEmployeeCost,
    expenseCount,
    employeeCount,
  };
};
