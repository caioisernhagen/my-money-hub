import { Account, Category, Transaction, CreditCard } from '@/types/finance';

export const mockAccounts: Account[] = [
  { id: '1', nome: 'Conta Corrente Itaú', tipo: 'Corrente', saldo_inicial: 5000, ativo: true },
  { id: '2', nome: 'Poupança Nubank', tipo: 'Poupança', saldo_inicial: 15000, ativo: true },
  { id: '3', nome: 'Carteira', tipo: 'Carteira', saldo_inicial: 500, ativo: true },
  { id: '4', nome: 'Investimentos XP', tipo: 'Investimento', saldo_inicial: 25000, ativo: true },
];

export const mockCategories: Category[] = [
  { id: '1', nome: 'Salário', tipo: 'Receita', cor: '#22c55e' },
  { id: '2', nome: 'Freelance', tipo: 'Receita', cor: '#10b981' },
  { id: '3', nome: 'Investimentos', tipo: 'Receita', cor: '#14b8a6' },
  { id: '4', nome: 'Alimentação', tipo: 'Despesa', cor: '#ef4444' },
  { id: '5', nome: 'Transporte', tipo: 'Despesa', cor: '#f97316' },
  { id: '6', nome: 'Moradia', tipo: 'Despesa', cor: '#8b5cf6' },
  { id: '7', nome: 'Saúde', tipo: 'Despesa', cor: '#ec4899' },
  { id: '8', nome: 'Lazer', tipo: 'Despesa', cor: '#06b6d4' },
  { id: '9', nome: 'Educação', tipo: 'Despesa', cor: '#3b82f6' },
  { id: '10', nome: 'Compras', tipo: 'Despesa', cor: '#f59e0b' },
];

export const mockTransactions: Transaction[] = [
  { id: '1', descricao: 'Salário Janeiro', valor: 8500, data: '2025-01-05', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '2', descricao: 'Projeto Website', valor: 3500, data: '2025-01-10', tipo: 'Receita', conta_id: '1', categoria_id: '2', pago: true, cartao: false },
  { id: '3', descricao: 'Supermercado', valor: 850, data: '2025-01-08', tipo: 'Despesa', conta_id: '1', categoria_id: '4', pago: true, cartao: true },
  { id: '4', descricao: 'Uber mensal', valor: 280, data: '2025-01-12', tipo: 'Despesa', conta_id: '1', categoria_id: '5', pago: true, cartao: true },
  { id: '5', descricao: 'Aluguel', valor: 2500, data: '2025-01-10', tipo: 'Despesa', conta_id: '1', categoria_id: '6', pago: true, cartao: false },
  { id: '6', descricao: 'Academia', valor: 150, data: '2025-01-05', tipo: 'Despesa', conta_id: '1', categoria_id: '7', pago: true, cartao: true },
  { id: '7', descricao: 'Cinema e jantar', valor: 180, data: '2025-01-14', tipo: 'Despesa', conta_id: '3', categoria_id: '8', pago: true, cartao: false },
  { id: '8', descricao: 'Curso Udemy', valor: 89.90, data: '2025-01-03', tipo: 'Despesa', conta_id: '1', categoria_id: '9', pago: true, cartao: true },
  { id: '9', descricao: 'Roupas', valor: 450, data: '2025-01-15', tipo: 'Despesa', conta_id: '1', categoria_id: '10', pago: false, cartao: true },
  { id: '10', descricao: 'Dividendos', valor: 350, data: '2025-01-15', tipo: 'Receita', conta_id: '4', categoria_id: '3', pago: true, cartao: false },
  
  // Dezembro
  { id: '11', descricao: 'Salário Dezembro', valor: 8500, data: '2024-12-05', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '12', descricao: 'Supermercado', valor: 920, data: '2024-12-10', tipo: 'Despesa', conta_id: '1', categoria_id: '4', pago: true, cartao: true },
  { id: '13', descricao: 'Presentes Natal', valor: 800, data: '2024-12-20', tipo: 'Despesa', conta_id: '1', categoria_id: '10', pago: true, cartao: true },
  { id: '14', descricao: 'Aluguel', valor: 2500, data: '2024-12-10', tipo: 'Despesa', conta_id: '1', categoria_id: '6', pago: true, cartao: false },
  
  // Novembro
  { id: '15', descricao: 'Salário Novembro', valor: 8500, data: '2024-11-05', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '16', descricao: 'Bônus', valor: 4000, data: '2024-11-15', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '17', descricao: 'Supermercado', valor: 780, data: '2024-11-12', tipo: 'Despesa', conta_id: '1', categoria_id: '4', pago: true, cartao: true },
  { id: '18', descricao: 'Aluguel', valor: 2500, data: '2024-11-10', tipo: 'Despesa', conta_id: '1', categoria_id: '6', pago: true, cartao: false },
  
  // Outubro
  { id: '19', descricao: 'Salário Outubro', valor: 8500, data: '2024-10-05', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '20', descricao: 'Supermercado', valor: 850, data: '2024-10-14', tipo: 'Despesa', conta_id: '1', categoria_id: '4', pago: true, cartao: true },
  { id: '21', descricao: 'Aluguel', valor: 2500, data: '2024-10-10', tipo: 'Despesa', conta_id: '1', categoria_id: '6', pago: true, cartao: false },
  { id: '22', descricao: 'Viagem', valor: 1500, data: '2024-10-20', tipo: 'Despesa', conta_id: '1', categoria_id: '8', pago: true, cartao: true },
  
  // Setembro
  { id: '23', descricao: 'Salário Setembro', valor: 8500, data: '2024-09-05', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '24', descricao: 'Supermercado', valor: 720, data: '2024-09-08', tipo: 'Despesa', conta_id: '1', categoria_id: '4', pago: true, cartao: true },
  { id: '25', descricao: 'Aluguel', valor: 2500, data: '2024-09-10', tipo: 'Despesa', conta_id: '1', categoria_id: '6', pago: true, cartao: false },
  
  // Agosto
  { id: '26', descricao: 'Salário Agosto', valor: 8500, data: '2024-08-05', tipo: 'Receita', conta_id: '1', categoria_id: '1', pago: true, cartao: false },
  { id: '27', descricao: 'Freelance App', valor: 5000, data: '2024-08-20', tipo: 'Receita', conta_id: '1', categoria_id: '2', pago: true, cartao: false },
  { id: '28', descricao: 'Supermercado', valor: 800, data: '2024-08-10', tipo: 'Despesa', conta_id: '1', categoria_id: '4', pago: true, cartao: true },
  { id: '29', descricao: 'Aluguel', valor: 2500, data: '2024-08-10', tipo: 'Despesa', conta_id: '1', categoria_id: '6', pago: true, cartao: false },
];

export const mockCreditCards: CreditCard[] = [
  { id: '1', descricao: 'Nubank', data_vencimento: 15, data_fechamento: 8 },
  { id: '2', descricao: 'Itaú Platinum', data_vencimento: 20, data_fechamento: 13 },
];

export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  const accountTransactions = transactions.filter(t => t.conta_id === account.id && t.pago);
  const receitas = accountTransactions.filter(t => t.tipo === 'Receita').reduce((sum, t) => sum + t.valor, 0);
  const despesas = accountTransactions.filter(t => t.tipo === 'Despesa').reduce((sum, t) => sum + t.valor, 0);
  return account.saldo_inicial + receitas - despesas;
}

export function getMonthlyData(transactions: Transaction[]): { mes: string; receitas: number; despesas: number }[] {
  const months: { [key: string]: { receitas: number; despesas: number } } = {};
  
  transactions.forEach(t => {
    const date = new Date(t.data);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!months[monthKey]) {
      months[monthKey] = { receitas: 0, despesas: 0 };
    }
    
    if (t.tipo === 'Receita') {
      months[monthKey].receitas += t.valor;
    } else {
      months[monthKey].despesas += t.valor;
    }
  });
  
  const sortedMonths = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);
  
  return sortedMonths.map(([key, data]) => {
    const [year, month] = key.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return {
      mes: `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`,
      ...data
    };
  });
}

export function getCategoryExpenses(transactions: Transaction[], categories: Category[]): { categoria: string; cor: string; valor: number; percentual: number }[] {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = transactions.filter(t => {
    const date = new Date(t.data);
    return t.tipo === 'Despesa' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const total = monthlyExpenses.reduce((sum, t) => sum + t.valor, 0);
  
  const byCategory: { [key: string]: number } = {};
  monthlyExpenses.forEach(t => {
    if (!byCategory[t.categoria_id]) {
      byCategory[t.categoria_id] = 0;
    }
    byCategory[t.categoria_id] += t.valor;
  });
  
  return Object.entries(byCategory)
    .map(([catId, valor]) => {
      const category = categories.find(c => c.id === catId);
      return {
        categoria: category?.nome || 'Outros',
        cor: category?.cor || '#888888',
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0
      };
    })
    .sort((a, b) => b.valor - a.valor);
}
