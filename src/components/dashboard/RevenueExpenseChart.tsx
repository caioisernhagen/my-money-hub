import { useState, useMemo } from 'react';
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
import { getMonthlyDataForPeriod } from '@/lib/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RevenueExpenseChart() {
  const { transactions } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const data = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      const monthData = getMonthlyDataForPeriod(transactions, date.getFullYear(), date.getMonth());
      months.push({
        mes: format(date, 'MMM/yy', { locale: ptBR }),
        ...monthData,
      });
    }
    return months;
  }, [transactions, currentDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 6));
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 6));

  return (
    <div className="stat-card h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-foreground">
          Receitas vs Despesas
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="mes" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              fontSize: '13px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '15px' }}
            iconSize={8}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                {value === 'receitas' ? 'Receitas' : 'Despesas'}
              </span>
            )}
          />
          <Bar 
            dataKey="receitas" 
            fill="hsl(var(--income))" 
            radius={[6, 6, 0, 0]}
            name="receitas"
          />
          <Bar 
            dataKey="despesas" 
            fill="hsl(var(--expense))" 
            radius={[6, 6, 0, 0]}
            name="despesas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
