import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { AccountsTable } from "@/components/dashboard/AccountsTable";
import { BalanceProjectionChart } from "@/components/dashboard/BalanceProjectionChart";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { FutureInvoices } from "@/components/dashboard/FutureInvoices";
import { useFinance } from "@/contexts/FinanceContext";
import { useCreditCards } from "@/hooks/useCreditCards";
import { TrendingUp, TrendingDown, Wallet, Receipt, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
// import { obterDataExibicaoComMapa } from "@/lib/creditCardHelpers";

export default function Dashboard() {
  const { transactions, accounts, getAccountBalance } = useFinance();
  const { creditCards } = useCreditCards();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const stats = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthlyTransactions = transactions.filter((t) => {
      let date: Date;
      if (t.cartao && t.fatura_mes) {
        date = addMonths(new Date(t.fatura_mes + "-01T12:00:00"), 1);
      } else {
        date = new Date(t.data + "T12:00:00");
      }
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
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(stats.despesas)}
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Saldo Mensal"
          value={formatCurrency(stats.saldo)}
          icon={Wallet}
          variant={stats.saldo >= 0 ? "income" : "expense"}
        />
        <StatCard
          title="Pendentes"
          value={formatCurrency(stats.pendentes)}
          icon={Receipt}
          variant="default"
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
    </MainLayout>
  );
}
