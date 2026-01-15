import { useFinance } from '@/contexts/FinanceContext';
import { Wallet, TrendingUp, PiggyBank, Landmark, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const accountIcons = {
  Corrente: Landmark,
  Poupança: PiggyBank,
  Investimento: TrendingUp,
  Carteira: Wallet,
  Outro: DollarSign,
};

export function AccountsTable() {
  const { accounts, getAccountBalance } = useFinance();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const activeAccounts = accounts.filter(a => a.ativo);
  const totalBalance = activeAccounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Saldo das Contas
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          Total: {formatCurrency(totalBalance)}
        </span>
      </div>
      
      <div className="space-y-3">
        {activeAccounts.map((account) => {
          const balance = getAccountBalance(account.id);
          const Icon = accountIcons[account.tipo] || Wallet;
          
          return (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{account.nome}</p>
                  <p className="text-xs text-muted-foreground">{account.tipo}</p>
                </div>
              </div>
              <p className={cn(
                "font-display font-semibold",
                balance >= 0 ? 'text-income' : 'text-expense'
              )}>
                {formatCurrency(balance)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
