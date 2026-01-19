import { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectionData {
  mes: string;
  saldo: number;
  isProjected: boolean;
}

export function BalanceProjectionChart() {
  const { transactions, accounts, getAccountBalance } = useFinance();
  const [offset, setOffset] = useState(0);
  
  const data = useMemo(() => {
    const today = new Date();
    const currentTotalBalance = accounts
      .filter(a => a.ativo)
      .reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);
    
    // Calcula média de receitas e despesas dos últimos 3 meses
    const last3Months = Array.from({ length: 3 }, (_, i) => {
      const monthDate = addMonths(today, -i - 1);
      return {
        start: startOfMonth(monthDate),
        end: endOfMonth(monthDate),
      };
    });
    
    let totalReceitas = 0;
    let totalDespesas = 0;
    let monthsWithData = 0;
    
    last3Months.forEach(({ start, end }) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.data);
        return date >= start && date <= end;
      });
      
      if (monthTransactions.length > 0) {
        monthsWithData++;
        monthTransactions.forEach(t => {
          if (t.tipo === 'Receita') {
            totalReceitas += t.valor;
          } else {
            totalDespesas += t.valor;
          }
        });
      }
    });
    
    const avgReceitas = monthsWithData > 0 ? totalReceitas / monthsWithData : 0;
    const avgDespesas = monthsWithData > 0 ? totalDespesas / monthsWithData : 0;
    const avgSaldo = avgReceitas - avgDespesas;
    
    // Gera projeção para 12 meses (6 por vez com navegação)
    const startMonth = offset * 6;
    const projectionData: ProjectionData[] = [];
    
    for (let i = startMonth; i < startMonth + 6; i++) {
      const monthDate = addMonths(today, i);
      const isCurrentMonth = isSameMonth(monthDate, today);
      const isPast = monthDate < startOfMonth(today);
      
      let saldo: number;
      
      if (isPast || isCurrentMonth) {
        // Para meses passados ou atual, calcular saldo real
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.data);
          return date <= endOfMonth(monthDate);
        });
        
        const totalAccounts = accounts
          .filter(a => a.ativo)
          .reduce((sum, acc) => sum + acc.saldo_inicial, 0);
        
        const receitas = monthTransactions
          .filter(t => t.tipo === 'Receita')
          .reduce((sum, t) => sum + t.valor, 0);
        
        const despesas = monthTransactions
          .filter(t => t.tipo === 'Despesa')
          .reduce((sum, t) => sum + t.valor, 0);
        
        saldo = totalAccounts + receitas - despesas;
      } else {
        // Para meses futuros, projetar
        const monthsAhead = i;
        saldo = currentTotalBalance + (avgSaldo * monthsAhead);
      }
      
      projectionData.push({
        mes: format(monthDate, 'MMM/yy', { locale: ptBR }),
        saldo: Math.round(saldo * 100) / 100,
        isProjected: !isPast && !isCurrentMonth,
      });
    }
    
    return projectionData;
  }, [transactions, accounts, getAccountBalance, offset]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const canGoBack = offset > -2;
  const canGoForward = offset < 4;

  return (
    <div className="stat-card h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Projeção de Saldo
          </h3>
          <p className="text-sm text-muted-foreground">
            Baseado na média dos últimos 3 meses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setOffset(prev => prev - 1)}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setOffset(prev => prev + 1)}
            disabled={!canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            formatter={(value: number, name: string, props: any) => [
              formatCurrency(value),
              props.payload.isProjected ? 'Saldo Projetado' : 'Saldo Real'
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
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
                  fill={payload.isProjected ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))'}
                  stroke={payload.isProjected ? 'hsl(var(--border))' : 'hsl(var(--primary))'}
                  strokeWidth={2}
                  strokeDasharray={payload.isProjected ? '2 2' : '0'}
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
