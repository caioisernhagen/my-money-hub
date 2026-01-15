import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { getMonthlyData } from '@/lib/mockData';

export function RevenueExpenseChart() {
  const { transactions } = useFinance();
  
  const data = useMemo(() => getMonthlyData(transactions), [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="stat-card h-[400px]">
      <h3 className="text-lg font-display font-semibold text-foreground mb-6">
        Receitas vs Despesas
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="mes" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
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
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))' }}>
                {value === 'receitas' ? 'Receitas' : 'Despesas'}
              </span>
            )}
          />
          <Bar 
            dataKey="receitas" 
            fill="hsl(var(--income))" 
            radius={[4, 4, 0, 0]}
            name="receitas"
          />
          <Bar 
            dataKey="despesas" 
            fill="hsl(var(--expense))" 
            radius={[4, 4, 0, 0]}
            name="despesas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
