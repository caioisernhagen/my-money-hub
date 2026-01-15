import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, TransactionType, TransactionFilters } from '@/types/finance';
import { toast } from 'sonner';

interface DbTransaction {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  conta_id: string;
  categoria_id: string;
  pago: boolean;
  cartao: boolean;
  cartao_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('data', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar lançamentos');
    } else {
      setTransactions((data as DbTransaction[] || []).map(t => ({
        id: t.id,
        descricao: t.descricao,
        valor: Number(t.valor),
        data: t.data,
        tipo: t.tipo as TransactionType,
        conta_id: t.conta_id,
        categoria_id: t.categoria_id,
        pago: t.pago,
        cartao: t.cartao,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        descricao: transaction.descricao,
        valor: transaction.valor,
        data: transaction.data,
        tipo: transaction.tipo,
        conta_id: transaction.conta_id,
        categoria_id: transaction.categoria_id,
        pago: transaction.pago,
        cartao: transaction.cartao,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao criar lançamento');
      return null;
    }
    
    const newTransaction: Transaction = {
      id: data.id,
      descricao: data.descricao,
      valor: Number(data.valor),
      data: data.data,
      tipo: data.tipo as TransactionType,
      conta_id: data.conta_id,
      categoria_id: data.categoria_id,
      pago: data.pago,
      cartao: data.cartao,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  }, [user]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar lançamento');
      return false;
    }
    
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
    return true;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir lançamento');
      return false;
    }
    
    setTransactions(prev => prev.filter(t => t.id !== id));
    return true;
  }, []);

  const togglePago = useCallback(async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    await updateTransaction(id, { pago: !transaction.pago });
  }, [transactions, updateTransaction]);

  const toggleCartao = useCallback(async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    await updateTransaction(id, { cartao: !transaction.cartao });
  }, [transactions, updateTransaction]);

  const filterTransactions = useCallback((filters: TransactionFilters): Transaction[] => {
    return transactions.filter(t => {
      if (filters.dataInicio && t.data < filters.dataInicio) return false;
      if (filters.dataFim && t.data > filters.dataFim) return false;
      if (filters.conta_id && t.conta_id !== filters.conta_id) return false;
      if (filters.categoria_id && t.categoria_id !== filters.categoria_id) return false;
      if (filters.tipo && t.tipo !== filters.tipo) return false;
      if (filters.pago !== undefined && t.pago !== filters.pago) return false;
      if (filters.cartao !== undefined && t.cartao !== filters.cartao) return false;
      return true;
    });
  }, [transactions]);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePago,
    toggleCartao,
    filterTransactions,
    refetch: fetchTransactions,
  };
}
