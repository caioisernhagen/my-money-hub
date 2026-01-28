import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthlyDataForPeriod, getDataForYear } from "@/lib/mockData";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

interface ProjectionData {
  mes: string;
  [key: string]: string | number;
}

const ACCOUNT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142, 71%, 45%)", // green
  "hsl(38, 92%, 50%)", // amber
  "hsl(262, 80%, 50%)", // violet
  "hsl(220, 90%, 56%)", // blue
  "hsl(16, 100%, 50%)", // orange
];

export function BalanceProjectionChart() {
  const { transactions, accounts } = useFinance();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const activeAccounts = accounts.filter((t) => t.ativo);

  const data = useMemo(() => {
    const months: ProjectionData[] = [];

    // Inicializar saldos das contas
    const accountBalances: { [key: string]: number } = {};
    activeAccounts.forEach((account) => {
      accountBalances[account.id] = account.saldo_inicial;
    });

    const startYear = Math.min(currentYear, new Date().getFullYear());

    // Se está vendo um ano anterior, somar transações desde o início até o final do ano anterior
    if (currentYear > new Date().getFullYear()) {
      for (let year = startYear; year < currentYear; year++) {
        activeAccounts.forEach((account) => {
          const monthData = getDataForYear(transactions, year, account.id);
          const netAmount = monthData.receitas - monthData.despesas;
          accountBalances[account.id] += netAmount;
        });
      }
    }
    // } else if (currentYear === new Date().getFullYear()) {
    //   // Se é o ano atual, somar transações até agora
    //   const hoje = new Date();
    //   for (let month = 0; month < hoje.getMonth(); month++) {
    //     const monthData = getMonthlyDataForPeriod(
    //       transactions,
    //       currentYear,
    //       month,
    //       account.id,
    //     );
    //     const netAmount = monthData.receitas - monthData.despesas;
    //     activeAccounts.forEach((account) => {
    //       accountBalances[account.id] += netAmount; // / activeAccounts.length;
    //     });
    //   }
    // }

    // Projetar os 12 meses do currentYear
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const monthEntry: ProjectionData = {
        mes: format(date, "MMM/yy", { locale: ptBR }),
      };

      activeAccounts.forEach((account) => {
        const monthData = getMonthlyDataForPeriod(
          transactions,
          currentYear,
          month,
          account.id,
        );

        const netAmount = monthData.receitas - monthData.despesas;
        accountBalances[account.id] += netAmount;
        monthEntry[account.id] = accountBalances[account.id];
      });

      months.push(monthEntry);
    }

    return months;
  }, [transactions, currentYear, activeAccounts]);

  const handlePrev = () => setCurrentYear((prev) => prev - 1);
  const handleNext = () => setCurrentYear((prev) => prev + 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="stat-card h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Projeção de Saldo
          </h3>
          {/* <p className="text-sm text-muted-foreground">
            Baseado em receitas e despesas
          </p> */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold text-foreground">
            {currentYear}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {activeAccounts.map((account, index) => (
              <linearGradient
                key={`gradient-${account.nome}`}
                id={`gradient-${account.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="mes"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const account = activeAccounts.find((acc) => acc.id === name);
              return [formatCurrency(value), account?.nome || name];
            }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--destructive))"
            strokeDasharray="5 5"
          />
          {activeAccounts.map((account, index) => (
            <Area
              key={account.nome}
              type="monotone"
              dataKey={account.id}
              stroke={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
              fill={`url(#gradient-${account.id})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
