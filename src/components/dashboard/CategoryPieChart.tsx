import { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { getCategoryExpenses } from '@/lib/mockData';

export function CategoryPieChart() {
  const { transactions, categories } = useFinance();
  
  const data = useMemo(
    () => getCategoryExpenses(transactions, categories), 
    [transactions, categories]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <div className="stat-card h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Sem despesas este mês</p>
      </div>
    );
  }

  return (
    <div className="stat-card h-[400px]">
      <h3 className="text-lg font-display font-semibold text-foreground mb-6">
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
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend 
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            formatter={(value, entry: any) => (
              <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                {value} ({entry.payload.percentual.toFixed(0)}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
