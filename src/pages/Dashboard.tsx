import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { AccountsTable } from "@/components/dashboard/AccountsTable";
import { BalanceProjectionChart } from "@/components/dashboard/BalanceProjectionChart";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { FutureInvoices } from "@/components/dashboard/FutureInvoices";
import { NewTransactionDialog } from "@/components/NewTransactionDialog";
import { useFinance } from "@/contexts/FinanceContext";
import { useCreditCards } from "@/hooks/useCreditCards";
import { TrendingUp, TrendingDown, Wallet, Receipt, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const {
    transactions,
    accounts,
    getAccountBalance,
    categories,
    addTransaction,
  } = useFinance();
  const { creditCards } = useCreditCards();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthlyTransactions = transactions.filter((t) => {
      const date =
        t.cartao && t.fatura_mes
          ? new Date(t.fatura_mes + "-01T12:00:00")
          : new Date(t.data + "T12:00:00");
      return date >= monthStart && date <= monthEnd;
    });

    const receitas = monthlyTransactions
      .filter((t) => t.tipo === "Receita")
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = monthlyTransactions
      .filter((t) => t.tipo === "Despesa")
      .reduce((sum, t) => sum + t.valor, 0);

    const saldo = receitas - despesas;

    const totalBalance = accounts
      .filter((a) => a.ativo)
      .reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);

    const pendentes = monthlyTransactions
      .filter((t) => !t.pago && t.tipo === "Despesa")
      .reduce((sum, t) => sum + t.valor, 0);

    return { receitas, despesas, saldo, totalBalance, pendentes };
  }, [transactions, accounts, getAccountBalance, selectedDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const monthName = format(selectedDate, "MMMM", { locale: ptBR });
  const year = selectedDate.getFullYear();

  return (
    <MainLayout
      title="Dashboard"
      subtitle={`Visão geral de ${monthName} de ${year}`}
      headerActions={
        <MonthSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          title="Receitas"
          value={formatCurrency(stats.receitas)}
          icon={TrendingUp}
          variant="income"
          selectedDate={selectedDate}
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(stats.despesas)}
          icon={TrendingDown}
          variant="expense"
          selectedDate={selectedDate}
        />
        <StatCard
          title="Saldo Mensal"
          value={formatCurrency(stats.saldo)}
          icon={Wallet}
          variant={stats.saldo >= 0 ? "income" : "expense"}
          selectedDate={selectedDate}
        />
        <StatCard
          title="Pendentes"
          value={formatCurrency(stats.pendentes)}
          icon={Receipt}
          variant="pending"
          selectedDate={selectedDate}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AccountsTable />
        <BalanceProjectionChart />
        <CategoryPieChart selectedDate={selectedDate} />
        <RevenueExpenseChart />
      </div>

      {/* Próximas Faturas */}
      <div className="mb-6">
        <FutureInvoices
          creditCards={creditCards}
          transactions={transactions}
          mesesAMostrar={3}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20 lg:pb-0"></div>

      {/* Floating Action Button para novo lançamento */}
      <NewTransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={async (data) => {
          const result = await addTransaction(data);
          return !!result;
        }}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
        trigger={
          <button
            className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
            title="Novo lançamento"
          >
            <Plus className="h-6 w-6" />
          </button>
        }
        showTrigger={false}
      />
    </MainLayout>
  );
}
