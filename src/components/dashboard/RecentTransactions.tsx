import { useFinance } from '@/contexts/FinanceContext';
import { ArrowUpRight, ArrowDownRight, CreditCard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RecentTransactions() {
  const { transactions, categories, accounts } = useFinance();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  return (
    <div className="stat-card">
      <h3 className="text-lg font-display font-semibold text-foreground mb-6">
        Últimos Lançamentos
      </h3>
      
      <div className="space-y-3">
        {recentTransactions.map((transaction) => {
          const category = categories.find(c => c.id === transaction.categoria_id);
          const account = accounts.find(a => a.id === transaction.conta_id);
          const isIncome = transaction.tipo === 'Receita';
          
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${category?.cor}20` }}
                >
                  {isIncome ? (
                    <ArrowUpRight className="h-5 w-5 text-income" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-expense" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{transaction.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `${category?.cor}15`,
                        color: category?.cor
                      }}
                    >
                      {category?.nome}
                    </span>
                    {transaction.cartao && (
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                    )}
                    {transaction.pago && (
                      <Check className="h-3 w-3 text-income" />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  isIncome ? 'text-income' : 'text-expense'
                )}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.valor)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.data)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
