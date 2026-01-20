import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Account, Category, Transaction, TransactionFilters } from '@/types/finance';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  
  // Account operations
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account | null>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  getAccountBalance: (id: string) => number;
  
  // Category operations
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  
  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction | null>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  togglePago: (id: string) => Promise<void>;
  toggleCartao: (id: string) => Promise<void>;
  filterTransactions: (filters: TransactionFilters) => Transaction[];
  
  // Refetch functions
  refetchAll: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const {
    accounts,
    loading: accountsLoading,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: refetchAccounts,
  } = useAccounts();

  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: refetchCategories,
  } = useCategories();

  const {
    transactions,
    loading: transactionsLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePago,
    toggleCartao,
    filterTransactions,
    refetch: refetchTransactions,
  } = useTransactions();

  const loading = accountsLoading || categoriesLoading || transactionsLoading;

  // Saldo calculado apenas com transações pagas
  const getAccountBalance = useCallback((id: string): number => {
    const account = accounts.find(a => a.id === id);
    if (!account) return 0;
    
    const accountTransactions = transactions.filter(t => t.conta_id === id && t.pago);
    const income = accountTransactions
      .filter(t => t.tipo === 'Receita')
      .reduce((sum, t) => sum + t.valor, 0);
    const expenses = accountTransactions
      .filter(t => t.tipo === 'Despesa')
      .reduce((sum, t) => sum + t.valor, 0);
    
    return account.saldo_inicial + income - expenses;
  }, [accounts, transactions]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchAccounts(),
      refetchCategories(),
      refetchTransactions(),
    ]);
  }, [refetchAccounts, refetchCategories, refetchTransactions]);

  const value = useMemo(() => ({
    accounts,
    categories,
    transactions,
    loading,
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
    refetchAll,
  }), [
    accounts,
    categories,
    transactions,
    loading,
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
    refetchAll,
  ]);

  return (
    <FinanceContext.Provider value={value}>
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
