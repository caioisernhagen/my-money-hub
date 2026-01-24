import {
  CreditCard,
  Transaction,
  InvoiceInfo,
  InvoiceStatus,
  Category,
} from "@/types/finance";
import { addMonths, format, parse, lastDayOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Calcula em qual mês de fatura a transação aparecerá
 * baseado na data de lançamento e data de fechamento do cartão
 *
 * @param dataLancamento - Data do lançamento (YYYY-MM-DD)
 * @param dataFechamento - Dia do mês do fechamento (1-31)
 * @returns Mês da fatura (YYYY-MM)
 *
 * Exemplo:
 * - Lançamento: 23/01/2026
 * - Fechamento: dia 20
 * - Como 23 > 20, aparece na próxima fatura: 2026-02
 */
export function calcularMesFatura(
  dataLancamento: string,
  dataFechamento: number,
): string {
  const lancamento = parse(dataLancamento, "yyyy-MM-dd", new Date());
  const diaLancamento = lancamento.getDate();

  // Se o lançamento é após o dia de fechamento, vai para o próximo mês
  if (diaLancamento > dataFechamento) {
    return format(addMonths(lancamento, 1), "yyyy-MM");
  }

  return format(lancamento, "yyyy-MM");
}

/**
 * Calcula a data de fechamento da fatura
 * @param mesFatura - Mês da fatura (YYYY-MM)
 * @param dataFechamento - Dia do mês do fechamento (1-31)
 * @returns Data de fechamento (YYYY-MM-DD)
 */
export function calcularDataFechamento(
  mesFatura: string,
  diaVencimento: number,
  diaFechamento: number,
): string {
  const mes = parse(mesFatura, "yyyy-MM", new Date());
  const variacao = diaVencimento < diaFechamento ? 1 : 0;
  return format(
    new Date(mes.getFullYear(), mes.getMonth() - variacao, diaFechamento),
    "yyyy-MM-dd",
  );
}

/**
 * Calcula a data de vencimento da fatura
 * @param mesFatura - Mês da fatura (YYYY-MM)
 * @param dataVencimento - Dia do mês do vencimento (1-31)
 * @returns Data de vencimento (YYYY-MM-DD)
 */
export function calcularDataVencimento(
  mesFatura: string,
  diaVencimento: number,
  diaFechamento: number,
): string {
  const mes = parse(mesFatura, "yyyy-MM", new Date());
  const variacao =
    diaVencimento < diaFechamento ||
    (diaFechamento < diaVencimento && diaVencimento <= 31)
      ? 0
      : 1;
  return format(
    new Date(mes.getFullYear(), mes.getMonth() + variacao, diaVencimento),
    "yyyy-MM-dd",
  );
}

/**
 * Gera lista de meses de fatura futuros disponíveis
 * Mostra os próximos 12 meses
 */
export function gerarOpcoesFatura(dataAtual: Date = new Date()): Array<{
  valor: string;
  label: string;
}> {
  const opcoes = [];

  for (let i = 0; i < 12; i++) {
    const mes = addMonths(dataAtual, i);
    const valor = format(mes, "yyyy-MM");
    const label = format(mes, "MMMM 'de' yyyy", { locale: ptBR });

    opcoes.push({
      valor,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }

  return opcoes;
}

/**
 * Formata o mês de fatura para exibição amigável
 * Exemplo: "2026-02" → "Fevereiro de 2026"
 */
export function formatarMesFatura(
  mesFatura: string | null | undefined,
): string {
  if (!mesFatura) return "-";

  try {
    const mes = parse(mesFatura, "yyyy-MM", new Date());
    return format(mes, "MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return mesFatura;
  }
}

/**
 * Calcula o mês de fatura e data de vencimento
 * Retorna ambas as informações para exibição
 */
export function calcularFaturaCompleta(
  dataLancamento: string,
  cartao: CreditCard,
): {
  mesFatura: string;
  dataFechamento: string;
  dataVencimento: string;
} {
  const mesFatura = calcularMesFatura(dataLancamento, cartao.data_fechamento);
  const dataFechamento = calcularDataFechamento(
    mesFatura,
    cartao.data_vencimento,
    cartao.data_fechamento,
  );
  const dataVencimento = calcularDataVencimento(
    mesFatura,
    cartao.data_vencimento,
    cartao.data_fechamento,
  );

  return {
    mesFatura,
    dataFechamento,
    dataVencimento,
  };
}

/**
 * Filtra transações por mês de fatura
 * @param transacoes - Lista de transações
 * @param mesFatura - Mês da fatura (YYYY-MM)
 * @param cartaoId - ID do cartão (opcional, para filtrar por cartão específico)
 */
export function filtrarTransacoesPorFatura(
  transacoes: Transaction[],
  mesFatura: string,
  cartaoId?: string,
): Transaction[] {
  return transacoes.filter((t) => {
    if (!t.fatura_mes) return false;
    if (t.fatura_mes !== mesFatura) return false;
    if (cartaoId && t.cartao_id !== cartaoId) return false;
    return true;
  });
}

/**
 * Calcula o status de uma fatura baseado nas transações
 */
export function calcularStatusFatura(transacoes: Transaction[]): InvoiceStatus {
  if (transacoes.length === 0) return "pendente";

  const totalTransacoes = transacoes.length;
  const transacoesPagas = transacoes.filter((t) => t.pago).length;

  if (transacoesPagas === 0) return "pendente";
  if (transacoesPagas === totalTransacoes) return "pago";
  return "parcial";
}

/**
 * Gera informações completas de uma fatura
 */
export function gerarInfoFatura(
  mesFatura: string,
  cartao: CreditCard,
  transacoes: Transaction[],
): InvoiceInfo {
  const transacoesFatura = filtrarTransacoesPorFatura(
    transacoes,
    mesFatura,
    cartao.id,
  );
  const valorTotal = transacoesFatura.reduce((sum, t) => sum + t.valor, 0);
  const status = calcularStatusFatura(transacoesFatura);
  const dataFechamento = calcularDataFechamento(
    mesFatura,
    cartao.data_vencimento,
    cartao.data_fechamento,
  );
  const dataVencimento = calcularDataVencimento(
    mesFatura,
    cartao.data_vencimento,
    cartao.data_fechamento,
  );

  return {
    mes: mesFatura,
    label: formatarMesFatura(mesFatura),
    data_fechamento: dataFechamento,
    data_vencimento: dataVencimento,
    valor_total: valorTotal,
    transacoes: transacoesFatura,
    status,
  };
}

/**
 * Agrupa transações por mês de fatura
 */
export function agruparTransacoesPorFatura(
  transacoes: Transaction[],
  cartaoId: string,
): Map<string, Transaction[]> {
  const agrupadas = new Map<string, Transaction[]>();

  transacoes.forEach((t) => {
    if (t.cartao_id !== cartaoId || !t.fatura_mes) return;

    if (!agrupadas.has(t.fatura_mes)) {
      agrupadas.set(t.fatura_mes, []);
    }
    agrupadas.get(t.fatura_mes)!.push(t);
  });

  // Ordenar por data
  const sorted = new Map(
    [...agrupadas.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );

  return sorted;
}

/**
 * Calcula impacto no mês atual vs próximo mês
 * Retorna separadamente despesas do mês atual e faturas futuras
 */
export function calcularImpactoMensal(
  transacoes: Transaction[],
  contas: Array<{ id: string }>,
  mesFatura?: string,
): {
  mesAtual: { receitas: number; despesas: number };
  proximoMes: { receitas: number; despesas: number };
} {
  const mesAtualStr = mesFatura || format(new Date(), "yyyy-MM");
  const proximoMesStr = format(new Date(mesAtualStr + "-01"), "yyyy-MM");

  const transacoesAtual = transacoes.filter((t) => {
    if (t.cartao) return false; // Cartão não impacta mês atual
    return t.data.startsWith(mesAtualStr);
  });

  const transacoesProximo = transacoes.filter((t) => {
    if (!t.cartao) return false; // Apenas cartão
    return t.fatura_mes === proximoMesStr;
  });

  return {
    mesAtual: {
      receitas: transacoesAtual
        .filter((t) => t.tipo === "Receita")
        .reduce((sum, t) => sum + t.valor, 0),
      despesas: transacoesAtual
        .filter((t) => t.tipo === "Despesa")
        .reduce((sum, t) => sum + t.valor, 0),
    },
    proximoMes: {
      receitas: transacoesProximo
        .filter((t) => t.tipo === "Receita")
        .reduce((sum, t) => sum + t.valor, 0),
      despesas: transacoesProximo
        .filter((t) => t.tipo === "Despesa")
        .reduce((sum, t) => sum + t.valor, 0),
    },
  };
}

/**
 * Verifica se uma transação é do mês atual ou impacta mês futuro
 */
export function ehDoMesAtual(
  transaction: Transaction,
  mesReferencia?: string,
): boolean {
  const mesRef = mesReferencia || format(new Date(), "yyyy-MM");

  if (transaction.cartao && transaction.fatura_mes) {
    // Transação de cartão impacta no mês da fatura
    return transaction.fatura_mes === mesRef;
  }

  // Transação de conta impacta no mês de lançamento
  return transaction.data.startsWith(mesRef);
}

/**
 * Obtém a data de exibição de uma transação
 * Para transações de cartão, retorna a data de vencimento da fatura
 * Para transações de contas, retorna a data original
 *
 * @param transaction - Transação
 * @param cartao - Cartão (necessário para transações de cartão)
 * @returns Data para exibição (YYYY-MM-DD)
 */
export function obterDataExibicao(
  transaction: Transaction,
  cartao?: CreditCard,
): string {
  // Se não é cartão ou não tem fatura_mes, retorna data original
  if (!transaction.cartao || !transaction.fatura_mes || !cartao) {
    return transaction.data;
  }

  // Para transações de cartão, retorna a data de vencimento da fatura
  return calcularDataVencimento(
    transaction.fatura_mes,
    cartao.data_vencimento,
    cartao.data_fechamento,
  );
}

/**
 * Obtém a data de exibição com o cartão já buscado do mapa
 * Versão simplificada para uso quando você já tem um mapa de cartões
 */
export function obterDataExibicaoComMapa(
  transaction: Transaction,
  creditCardsMap: Map<string, CreditCard>,
): string {
  if (
    !transaction.cartao ||
    !transaction.fatura_mes ||
    !transaction.cartao_id
  ) {
    return transaction.data;
  }

  const cartao = creditCardsMap.get(transaction.cartao_id);
  if (!cartao) return transaction.data;

  return calcularDataVencimento(
    transaction.fatura_mes,
    cartao.data_vencimento,
    cartao.data_fechamento,
  );
}
