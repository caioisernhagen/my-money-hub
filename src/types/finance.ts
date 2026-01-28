export type TransactionType = "Receita" | "Despesa";
export type InvoiceStatus = "pendente" | "parcial" | "pago";

export type AccountType =
  | "Corrente"
  | "Poupança"
  | "Investimento"
  | "Carteira"
  | "Outro";

export interface Account {
  id: string;
  nome: string;
  tipo: AccountType;
  saldo_inicial: number;
  ativo: boolean;
  saldo_atual?: number;
}

export interface Category {
  id: string;
  nome: string;
  tipo: TransactionType;
  cor: string;
  icone?: string;
}

export interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: TransactionType;
  conta_id: string;
  categoria_id: string;
  pago: boolean;
  cartao: boolean;
  cartao_id?: string | null;
  fatura_mes?: string | null;
  data_apresentacao?: string | null;
  status_cobranca?: InvoiceStatus;
  fixa?: boolean;
  parcelas?: number | null;
  parcela_atual?: number | null;
  transaction_parent_id?: string | null;
}

export interface CreditCard {
  id: string;
  descricao: string;
  data_vencimento: number;
  data_fechamento: number;
  limite: number;
}

export interface InvoiceInfo {
  mes: string;
  label: string;
  data_fechamento: string;
  data_vencimento: string;
  valor_total: number;
  transacoes: Transaction[];
  status: InvoiceStatus;
}

export interface TransactionFilters {
  dataInicio?: string;
  dataFim?: string;
  conta_id?: string;
  categoria_id?: string | string[];
  tipo?: TransactionType;
  pago?: boolean;
  cartao_id?: string;
}

export interface MonthlyData {
  mes: string;
  receitas: number;
  despesas: number;
}

export interface CategoryExpense {
  categoria: string;
  cor: string;
  valor: number;
  percentual: number;
}
