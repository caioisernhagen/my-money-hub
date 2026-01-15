import React, { createContext, useContext, useState, useCallback } from 'react';
import { Account, Category, Transaction, TransactionFilters } from '@/types/finance';
import { 
  mockAccounts, 
  mockCategories, 
  mockTransactions, 
  calculateAccountBalance 
} from '@/lib/mockData';

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  
  // Account operations
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => boolean;
  getAccountBalance: (id: string) => number;
  
  // Category operations
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  
  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  togglePago: (id: string) => void;
  toggleCartao: (id: string) => void;
  filterTransactions: (filters: TransactionFilters) => Transaction[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  // Account operations
  const addAccount = useCallback((account: Omit<Account, 'id'>) => {
    const newAccount = { ...account, id: Date.now().toString() };
    setAccounts(prev => [...prev, newAccount]);
  }, []);

  const updateAccount = useCallback((id: string, account: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...account } : a));
  }, []);

  const deleteAccount = useCallback((id: string): boolean => {
    const hasTransactions = transactions.some(t => t.conta_id === id);
    if (hasTransactions) return false;
    setAccounts(prev => prev.filter(a => a.id !== id));
    return true;
  }, [transactions]);

  const getAccountBalance = useCallback((id: string): number => {
    const account = accounts.find(a => a.id === id);
    if (!account) return 0;
    return calculateAccountBalance(account, transactions);
  }, [accounts, transactions]);

  // Category operations
  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
  }, []);

  const updateCategory = useCallback((id: string, category: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));
  }, []);

  const deleteCategory = useCallback((id: string): boolean => {
    const hasTransactions = transactions.some(t => t.categoria_id === id);
    if (hasTransactions) return false;
    setCategories(prev => prev.filter(c => c.id !== id));
    return true;
  }, [transactions]);

  // Transaction operations
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    setTransactions(prev => [...prev, newTransaction]);
  }, []);

  const updateTransaction = useCallback((id: string, transaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const togglePago = useCallback((id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, pago: !t.pago } : t
    ));
  }, []);

  const toggleCartao = useCallback((id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, cartao: !t.cartao } : t
    ));
  }, []);

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
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions]);

  return (
    <FinanceContext.Provider value={{
      accounts,
      categories,
      transactions,
      addAccount,
      updateAccount,
      deleteAccount,
      getAccountBalance,
      addCategory,
      updateCategory,
      deleteCategory,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      togglePago,
      toggleCartao,
      filterTransactions,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
