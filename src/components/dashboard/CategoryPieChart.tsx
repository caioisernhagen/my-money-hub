import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useFinance } from "@/contexts/FinanceContext";
import { getCategoryExpenses } from "@/lib/mockData";

interface CategoryPieChartProps {
  selectedDate?: Date;
}

export function CategoryPieChart({ selectedDate }: CategoryPieChartProps) {
  const { transactions, categories } = useFinance();

  const data = useMemo(
    () => getCategoryExpenses(transactions, categories, selectedDate),
    [transactions, categories, selectedDate],
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <div className="stat-card h-[360px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Sem despesas neste período
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card h-[360px]">
      <h3 className="text-base font-medium text-foreground mb-4">
        Despesas por Categoria
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            dataKey="valor"
            nameKey="categoria"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              fontSize: "13px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconSize={8}
            iconType="circle"
            formatter={(value, entry: any) => (
              <span
                style={{ color: "hsl(var(--foreground))", fontSize: "11px" }}
              >
                {value} ({entry.payload.percentual.toFixed(0)}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
