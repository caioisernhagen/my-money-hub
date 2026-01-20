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
import { getMonthlyDataForPeriod } from "@/lib/mockData";
import { ptBR } from "date-fns/locale";
import { addMonths, format, subMonths } from "date-fns";

interface ProjectionData {
  mes: string;
  saldo: number;
  isProjected: boolean;
}

export function BalanceProjectionChart() {
  const { transactions } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());

  const data = useMemo(() => {
    const months = [];
    let saldo = 0;
    for (let i = 0; i <= 5; i++) {
      const date = addMonths(currentDate, i);
      const monthData = getMonthlyDataForPeriod(
        transactions,
        date.getFullYear(),
        date.getMonth(),
      );
      saldo += monthData.receitas - monthData.despesas;
      months.push({
        mes: format(date, "MMM/yy", { locale: ptBR }),
        saldo: saldo,
      });
    }
    return months;
  }, [transactions, currentDate]);

  const handlePrev = () => setCurrentDate((prev) => subMonths(prev, 6));
  const handleNext = () => setCurrentDate((prev) => addMonths(prev, 6));

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
          <p className="text-sm text-muted-foreground">
            Baseado em receitas e despesas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrev}
            //disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            //disabled={!canGoForward}
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
            <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
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
            formatter={(value: number, name: string, props: any) => [
              formatCurrency(value),
              !props.payload.isProjected ? "Saldo Projetado" : "Saldo Real",
            ]}
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
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#saldoGradient)"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={
                    payload.isProjected
                      ? "hsl(var(--muted-foreground))"
                      : "hsl(var(--primary))"
                  }
                  stroke={
                    payload.isProjected
                      ? "hsl(var(--border))"
                      : "hsl(var(--primary))"
                  }
                  strokeWidth={2}
                  strokeDasharray={payload.isProjected ? "2 2" : "0"}
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
