import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { AccountsTable } from '@/components/dashboard/AccountsTable';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useFinance } from '@/contexts/FinanceContext';
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';

export default function Dashboard() {
  const { transactions, accounts, getAccountBalance } = useFinance();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.data);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const receitas = monthlyTransactions
      .filter(t => t.tipo === 'Receita')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = monthlyTransactions
      .filter(t => t.tipo === 'Despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    const saldo = receitas - despesas;

    const totalBalance = accounts
      .filter(a => a.ativo)
      .reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);

    const pendentes = monthlyTransactions
      .filter(t => !t.pago && t.tipo === 'Despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    return { receitas, despesas, saldo, totalBalance, pendentes };
  }, [transactions, accounts, getAccountBalance, currentMonth, currentYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={`Visão geral de ${monthName} de ${currentYear}`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(stats.receitas)}
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(stats.despesas)}
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Saldo do Mês"
          value={formatCurrency(stats.saldo)}
          icon={Wallet}
          variant={stats.saldo >= 0 ? 'income' : 'expense'}
        />
        <StatCard
          title="Despesas Pendentes"
          value={formatCurrency(stats.pendentes)}
          subtitle="A pagar"
          icon={Receipt}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueExpenseChart />
        <CategoryPieChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 lg:pb-0">
        <AccountsTable />
        <RecentTransactions />
      </div>
    </MainLayout>
  );
}
