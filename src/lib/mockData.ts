import { Account, Category, Transaction, CreditCard } from "@/types/finance";
import { startOfMonth, endOfMonth, format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export const mockAccounts: Account[] = [
  {
    id: "1",
    nome: "Conta Corrente Itaú",
    tipo: "Corrente",
    saldo_inicial: 5000,
    ativo: true,
  },
  {
    id: "2",
    nome: "Poupança Nubank",
    tipo: "Poupança",
    saldo_inicial: 15000,
    ativo: true,
  },
  {
    id: "3",
    nome: "Carteira",
    tipo: "Carteira",
    saldo_inicial: 500,
    ativo: true,
  },
  {
    id: "4",
    nome: "Investimentos XP",
    tipo: "Investimento",
    saldo_inicial: 25000,
    ativo: true,
  },
];

export const mockCategories: Category[] = [
  {
    id: "1",
    nome: "Salário",
    tipo: "Receita",
    cor: "#22c55e",
    icone: "Wallet",
  },
  {
    id: "2",
    nome: "Freelance",
    tipo: "Receita",
    cor: "#10b981",
    icone: "Briefcase",
  },
  {
    id: "3",
    nome: "Investimentos",
    tipo: "Receita",
    cor: "#14b8a6",
    icone: "TrendingUp",
  },
  {
    id: "4",
    nome: "Alimentação",
    tipo: "Despesa",
    cor: "#ef4444",
    icone: "Utensils",
  },
  {
    id: "5",
    nome: "Transporte",
    tipo: "Despesa",
    cor: "#f97316",
    icone: "Car",
  },
  { id: "6", nome: "Moradia", tipo: "Despesa", cor: "#8b5cf6", icone: "Home" },
  { id: "7", nome: "Saúde", tipo: "Despesa", cor: "#ec4899", icone: "Heart" },
  {
    id: "8",
    nome: "Lazer",
    tipo: "Despesa",
    cor: "#06b6d4",
    icone: "Gamepad2",
  },
  {
    id: "9",
    nome: "Educação",
    tipo: "Despesa",
    cor: "#3b82f6",
    icone: "GraduationCap",
  },
  {
    id: "10",
    nome: "Compras",
    tipo: "Despesa",
    cor: "#f59e0b",
    icone: "ShoppingBag",
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    descricao: "Salário Janeiro",
    valor: 8500,
    data: "2025-01-05",
    tipo: "Receita",
    conta_id: "1",
    categoria_id: "1",
    pago: true,
    cartao: false,
  },
  {
    id: "2",
    descricao: "Projeto Website",
    valor: 3500,
    data: "2025-01-10",
    tipo: "Receita",
    conta_id: "1",
    categoria_id: "2",
    pago: true,
    cartao: false,
  },
  {
    id: "3",
    descricao: "Supermercado",
    valor: 850,
    data: "2025-01-08",
    tipo: "Despesa",
    conta_id: "1",
    categoria_id: "4",
    pago: true,
    cartao: true,
  },
  {
    id: "4",
    descricao: "Uber mensal",
    valor: 280,
    data: "2025-01-12",
    tipo: "Despesa",
    conta_id: "1",
    categoria_id: "5",
    pago: true,
    cartao: true,
  },
  {
    id: "5",
    descricao: "Aluguel",
    valor: 2500,
    data: "2025-01-10",
    tipo: "Despesa",
    conta_id: "1",
    categoria_id: "6",
    pago: true,
    cartao: false,
  },
];

export const mockCreditCards: CreditCard[] = [
  {
    id: "1",
    descricao: "Nubank",
    data_vencimento: 15,
    data_fechamento: 8,
    limite: 5000,
  },
  {
    id: "2",
    descricao: "Itaú Platinum",
    data_vencimento: 20,
    data_fechamento: 13,
    limite: 10000,
  },
];

export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[],
): number {
  const accountTransactions = transactions.filter(
    (t) => t.conta_id === account.id && t.pago,
  );
  const receitas = accountTransactions
    .filter((t) => t.tipo === "Receita")
    .reduce((sum, t) => sum + t.valor, 0);
  const despesas = accountTransactions
    .filter((t) => t.tipo === "Despesa")
    .reduce((sum, t) => sum + t.valor, 0);
  return account.saldo_inicial + receitas - despesas;
}

export function getMonthlyDataForPeriod(
  transactions: Transaction[],
  year: number,
  month: number,
): { receitas: number; despesas: number } {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));

  const monthTransactions = transactions.filter((t) => {
    const date =
      t.cartao && t.fatura_mes
        ? new Date(t.fatura_mes + "-01T12:00:00")
        : new Date(t.data + "T12:00:00");
    return date >= monthStart && date <= monthEnd;
  });

  const receitas = monthTransactions
    .filter((t) => t.tipo === "Receita")
    .reduce((sum, t) => sum + t.valor, 0);

  const despesas = monthTransactions
    .filter((t) => t.tipo === "Despesa")
    .reduce((sum, t) => sum + t.valor, 0);

  return { receitas, despesas };
}

export function getMonthlyData(
  transactions: Transaction[],
): { mes: string; receitas: number; despesas: number }[] {
  const months: { [key: string]: { receitas: number; despesas: number } } = {};

  transactions.forEach((t) => {
    const date =
      t.cartao && t.fatura_mes
        ? new Date(t.fatura_mes + "-01T12:00:00")
        : new Date(t.data + "T12:00:00");
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!months[monthKey]) {
      months[monthKey] = { receitas: 0, despesas: 0 };
    }

    if (t.tipo === "Receita") {
      months[monthKey].receitas += t.valor;
    } else {
      months[monthKey].despesas += t.valor;
    }
  });

  const sortedMonths = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  return sortedMonths.map(([key, data]) => {
    const [year, month] = key.split("-");
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return {
      mes: `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`,
      ...data,
    };
  });
}

export function getCategoryExpenses(
  transactions: Transaction[],
  categories: Category[],
  selectedDate?: Date,
): { categoria: string; cor: string; valor: number; percentual: number }[] {
  const targetDate = selectedDate || new Date();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  const monthlyExpenses = transactions.filter((t) => {
    const date =
      t.cartao && t.fatura_mes
        ? new Date(t.fatura_mes + "-01T12:00:00")
        : new Date(t.data + "T12:00:00");
    return t.tipo === "Despesa" && date >= monthStart && date <= monthEnd;
  });

  const total = monthlyExpenses.reduce((sum, t) => sum + t.valor, 0);

  const byCategory: { [key: string]: number } = {};
  monthlyExpenses.forEach((t) => {
    if (!byCategory[t.categoria_id]) {
      byCategory[t.categoria_id] = 0;
    }
    byCategory[t.categoria_id] += t.valor;
  });

  return Object.entries(byCategory)
    .map(([catId, valor]) => {
      const category = categories.find((c) => c.id === catId);
      return {
        categoria: category?.nome || "Outros",
        cor: category?.cor || "#888888",
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.valor - a.valor);
}
