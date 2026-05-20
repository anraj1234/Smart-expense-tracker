import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export type ExpenseFilter = {
  search?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export function useExpenses(initialFilters: ExpenseFilter = { page: 1, limit: 10 }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ExpenseFilter>(initialFilters);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.limit) params.append("limit", filters.limit.toString());
      
      // Basic offset pagination for simplicity since API supports cursor, 
      // but we will just pass cursor if we have it. For now let's just fetch everything up to limit
      
      const res = await axios.get(`/api/expenses?${params.toString()}`);
      setExpenses(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    total,
    filters,
    setFilters,
    refetch: fetchExpenses
  };
}
