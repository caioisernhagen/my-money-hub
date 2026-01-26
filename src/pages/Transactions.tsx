import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useFinance } from "@/contexts/FinanceContext";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewTransactionDialog } from "@/components/NewTransactionDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  X,
  Loader2,
  Receipt,
  Repeat,
  ChevronDown,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBackground } from "@/components/IconBackground";
import {
  Transaction,
  TransactionType,
  TransactionFilters,
} from "@/types/finance";
//import { obterDataExibicaoComMapa } from "@/lib/creditCardHelpers";
import { toast } from "sonner";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import * as LucideIcons from "lucide-react";

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const {
    transactions,
    categories,
    accounts,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePago,
    filterTransactions,
  } = useFinance();

  const { creditCards } = useCreditCards();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "data-za" | "data-az" | "descricao-az" | "descricao-za"
  >("data-az");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Processar parâmetros da URL
  useEffect(() => {
    const tipo = searchParams.get("tipo");
    const mes = searchParams.get("mes");

    if (tipo && (tipo === "receita" || tipo === "despesa")) {
      setFilters((prev) => ({
        ...prev,
        tipo: tipo === "receita" ? "Receita" : "Despesa",
      }));
    }

    if (mes) {
      try {
        const [year, month] = mes.split("-");
        if (year && month) {
          const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          setSelectedDate(newDate);
        }
      } catch {
        // Se erro ao parsear, ignora
      }
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: format(new Date(), "yyyy-MM-dd"),
    tipo: "Despesa" as TransactionType,
    conta_id: "",
    categoria_id: "",
    pago: false,
    cartao: false,
    cartao_id: "",
    fatura_mes: "",
    fixa: false,
    parcelas: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleValorBlur = () => {
    // Ao perder foco, tenta avaliar a expressão
    if (/[\+\-\*\/]/.test(formData.valor)) {
      try {
        // Valida que contém apenas números, operadores e espaços
        if (!/^[\d\s\+\-\*\/\.]+$/.test(formData.valor)) {
          return;
        }
        // Avalia a expressão
        const result = Function(
          '"use strict"; return (' + formData.valor + ")",
        )();
        // Se resultado é um número válido, usa o resultado
        if (typeof result === "number" && !isNaN(result)) {
          setFormData({ ...formData, valor: result.toString() });
        }
      } catch {
        // Se há erro na avaliação, mantém o valor como está
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy");
  };

  // Mapa de cartões para fácil busca
  const creditCardsMap = useMemo(() => {
    const map = new Map();
    if (creditCards && creditCards.length > 0) {
      creditCards.forEach((card) => map.set(card.id, card));
    }
    return map;
  }, [creditCards]);

  // Função para obter a data de exibição correta (vencimento para cartão, data original para conta)
  // const obterDataExibicaoTransacao = (transaction: Transaction): string => {
  //   return obterDataExibicaoComMapa(transaction, creditCardsMap);
  // };

  // Filtro por mês selecionado + filtros adicionais + busca + ordenação
  const filteredTransactions = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthFilters: TransactionFilters = {
      ...filters,
      dataInicio: format(monthStart, "yyyy-MM-dd"),
      dataFim: format(monthEnd, "yyyy-MM-dd"),
    };

    let transactions = filterTransactions(monthFilters);

    // Aplicar busca por descrição
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      transactions = transactions.filter((t) =>
        t.descricao.toLowerCase().includes(searchLower),
      );
    }

    // Aplicar ordenação
    if (sortBy === "descricao-az") {
      transactions = transactions.sort((a, b) =>
        a.descricao.localeCompare(b.descricao),
      );
    } else if (sortBy === "descricao-za") {
      transactions = transactions.sort((a, b) =>
        b.descricao.localeCompare(a.descricao),
      );
    } else if (sortBy === "data-za") {
      // Por data (ascendente - do menor para maior)
      transactions = transactions.sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
      );
    } else if (sortBy === "data-az") {
      // Por data (descendente - do maior para menor)
      transactions = transactions.sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
      );
    }

    return transactions;
  }, [filterTransactions, filters, selectedDate, searchTerm, sortBy]);

  // Totais
  const totals = useMemo(() => {
    const pago = filteredTransactions
      .filter((t) => t.pago)
      .reduce((sum, t) => sum + (t.tipo === "Receita" ? t.valor : -t.valor), 0);

    const pendente = filteredTransactions
      .filter((t) => !t.pago)
      .reduce((sum, t) => sum + (t.tipo === "Receita" ? t.valor : -t.valor), 0);

    const total = pago + pendente;

    return { pago, pendente, total };
  }, [filteredTransactions]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.tipo === formData.tipo);
  }, [categories, formData.tipo]);

  const resetForm = () => {
    setFormData({
      descricao: "",
      valor: "",
      data: format(new Date(), "yyyy-MM-dd"),
      tipo: "Despesa",
      conta_id: accounts[0]?.id || "",
      categoria_id: "",
      pago: false,
      cartao: false,
      cartao_id: "",
      fatura_mes: "",
      fixa: false,
      parcelas: "",
    });
    setEditingTransaction(null);
  };

  // Gerar opções de fatura
  const faturaOptions = useMemo(() => {
    if (!formData.cartao || !formData.cartao_id || !formData.data) return [];

    const card = creditCards.find((c) => c.id === formData.cartao_id);
    if (!card) return [];

    const transactionDate = parseISO(formData.data);
    const options: { value: string; label: string }[] = [];

    for (let i = 0; i < 12; i++) {
      const faturaMonth = addMonths(startOfMonth(transactionDate), i + 1);
      const faturaDate = format(faturaMonth, "yyyy-MM");
      const label = format(faturaMonth, "MMMM'/'yyyy", { locale: ptBR });
      options.push({ value: faturaDate, label: `${label}` });
    }

    return options;
  }, [formData.cartao, formData.cartao_id, formData.data, creditCards]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      descricao: transaction.descricao,
      valor: transaction.valor.toString(),
      data: transaction.data,
      tipo: transaction.tipo,
      conta_id: transaction.conta_id,
      categoria_id: transaction.categoria_id,
      pago: transaction.pago,
      cartao: transaction.cartao,
      cartao_id: transaction.cartao_id || "",
      fatura_mes: transaction.fatura_mes || "",
      fixa: transaction.fixa || false,
      parcelas: "",
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Identificar qual botão foi clicado
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement;
    const action = submitter?.value || "salvar";

    const transactionData = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor) || 0,
      data: formData.data,
      tipo: formData.tipo,
      conta_id: formData.conta_id,
      categoria_id: formData.categoria_id,
      pago: formData.pago,
      cartao: formData.cartao,
      cartao_id: formData.cartao ? formData.cartao_id || null : null,
      fatura_mes: formData.cartao ? formData.fatura_mes || null : null,
      fixa: formData.fixa,
      parcelas:
        formData.cartao && formData.parcelas
          ? parseInt(formData.parcelas)
          : null,
    };

    if (editingTransaction) {
      const success = await updateTransaction(
        editingTransaction.id,
        transactionData,
        action,
      );
      if (success) {
        toast.success("Lançamento atualizado!");
        handleOpenChange(false);
      }
    } else {
      const result = await addTransaction(transactionData);
      if (result) {
        toast.success("Lançamento criado!");
        handleOpenChange(false);
      }
    }

    setIsSubmitting(false);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (
    action: "deletar" | "deletar-futuras" | "deletar-pendentes",
  ) => {
    if (!transactionToDelete) return;

    const success = await deleteTransaction(transactionToDelete.id, action);
    if (success) {
      toast.success("Lançamento(s) excluído(s)!");
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, v]) =>
      key !== "dataInicio" && key !== "dataFim" && v !== undefined && v !== "",
  );

  // Agrupar transações por data e cartão
  const transactionsByDate = useMemo(() => {
    const grouped: {
      [key: string]: {
        cards: {
          [cardKey: string]: {
            name: string;
            transactions: Transaction[];
            total: number;
          };
        };
        allTransactions: Transaction[];
      };
    } = {};
    const accountBalances: { [key: string]: number } = {};

    // Inicializar saldos das contas
    accounts.forEach((account) => {
      accountBalances[account.id] = account.saldo_inicial || 0;
    });

    // Agrupar por data e cartão
    filteredTransactions.forEach((transaction) => {
      const card = creditCards.find((c) => c.id === transaction.cartao_id);
      const day = card?.data_vencimento.toString().padStart(2, "0");

      // Data de exibição: vencimento para cartão, data original para conta
      const dateKey =
        transaction.cartao && card
          ? `${transaction.fatura_mes}-${day}`
          : transaction.data;

      const cardKey = transaction.cartao_id || "sem-cartao";
      const cardName = card ? card.descricao : "Sem cartão";

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          cards: {},
          allTransactions: [],
        };
      }

      if (!grouped[dateKey].cards[cardKey]) {
        grouped[dateKey].cards[cardKey] = {
          name: cardName,
          transactions: [],
          total: 0,
        };
      }

      grouped[dateKey].cards[cardKey].transactions.push(transaction);
      grouped[dateKey].cards[cardKey].total +=
        transaction.tipo === "Receita" ? transaction.valor : -transaction.valor;
      grouped[dateKey].allTransactions.push(transaction);
    });

    // Ordenar datas
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (sortBy === "data-za") {
        return new Date(b).getTime() - new Date(a).getTime();
      } else {
        return new Date(a).getTime() - new Date(b).getTime();
      }
    });

    // Calcular saldo projetado para cada data
    const result: {
      date: string;
      cards: {
        [cardKey: string]: {
          name: string;
          transactions: Transaction[];
          total: number;
        };
      };
      projectedBalance: number;
      allTransactions: Transaction[];
    }[] = [];

    sortedDates.forEach((date) => {
      const dayData = grouped[date];
      let dayBalance = 0;

      dayData.allTransactions.forEach((transaction) => {
        const value =
          transaction.tipo === "Receita"
            ? transaction.valor
            : -transaction.valor;
        dayBalance += value;
        accountBalances[transaction.conta_id] += value;
      });

      result.push({
        date,
        cards: dayData.cards,
        projectedBalance: Object.values(accountBalances).reduce(
          (sum, bal) => sum + bal,
          0,
        ),
        allTransactions: dayData.allTransactions,
      });
    });

    return result;
  }, [filteredTransactions, accounts, sortBy, creditCards]);

  if (loading) {
    return (
      <MainLayout title="Lançamentos" subtitle="Gerencie suas transações">
        <div className="stat-card pb-20 lg:pb-0">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Lançamentos"
      subtitle="Gerencie suas transações"
      headerActions={
        <MonthSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      }
    >
      <div className="pb-20 lg:pb-0">
        {/* Totals */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="stat-card !p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Pago</p>
            <p
              className={cn(
                "text-sm font-semibold",
                totals.pago >= 0 ? "text-income" : "text-expense",
              )}
            >
              {formatCurrency(totals.pago)}
            </p>
          </div>
          <div className="stat-card !p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Pendente</p>
            <p
              className={cn(
                "text-sm font-semibold",
                totals.pendente >= 0 ? "text-income" : "text-expense",
              )}
            >
              {formatCurrency(totals.pendente)}
            </p>
          </div>
          <div className="stat-card !p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p
              className={cn(
                "text-sm font-semibold",
                totals.total >= 0 ? "text-income" : "text-expense",
              )}
            >
              {formatCurrency(totals.total)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {/* Top Bar - Busca, Ordenação e Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center sm:justify-between">
            {/* Botão Filtros */}
            <Button
              variant="outline"
              //variant={hasActiveFilters ? "ghost" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 stat-card ${hasActiveFilters ? "text-expense" : ""}`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
              Filtros
              {/* {hasActiveFilters && (
                <span className="ml-1 h-4 w-4 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                  !
                </span>
              )} */}
            </Button>

            {/* Floating Action Button para novo lançamento */}
            <NewTransactionDialog
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              onSubmit={async (data) => {
                const result = await addTransaction(data);
                return !!result;
              }}
              categories={categories}
              accounts={accounts}
              creditCards={creditCards}
              trigger={
                <button
                  className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
                  title="Novo lançamento"
                >
                  <Plus className="h-6 w-6" />
                </button>
              }
              showTrigger={false}
            />
          </div>

          {/* Filtros Expansíveis */}
          {showFilters && (
            <div className="stat-card grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 rounded-lg bg-secondary/30 border border-secondary/50">
              {/* Busca com botão interno */}
              <div className="relative w-full sm:flex-1">
                <Input
                  placeholder="Buscar por descrição"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full text-sm stat-card pr-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Ordenação */}
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="h-9 w-full sm:w-36 text-sm stat-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-az">▲ Data</SelectItem>
                  <SelectItem value="data-za">▼ Data</SelectItem>
                  <SelectItem value="descricao-az">▲ Descrição</SelectItem>
                  <SelectItem value="descricao-za">▼ Descrição</SelectItem>
                </SelectContent>
              </Select>
              {/* Conta */}
              <div>
                <Label className="text-xs mb-1 block">Conta</Label>
                <Select
                  value={filters.conta_id || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      conta_id: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <IconBackground
                        icon="Globe"
                        color="#45b6fe"
                        text="Todas"
                      />
                    </SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <IconBackground
                          icon="Wallet"
                          color="#45b6fe"
                          text={account.nome}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <div>
                <Label className="text-xs mb-1 block">Tipo</Label>
                <Select
                  value={filters.tipo || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      tipo:
                        value === "all"
                          ? undefined
                          : (value as TransactionType),
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <IconBackground
                        icon="Globe"
                        color="#45b6fe"
                        text="Todos"
                      />
                    </SelectItem>
                    <SelectItem value="Receita">
                      <IconBackground
                        icon="ArrowUpRight"
                        color="#008000"
                        text="Receita"
                      />
                    </SelectItem>
                    <SelectItem value="Despesa">
                      <IconBackground
                        icon="ArrowDownRight"
                        color="#e24a4b"
                        text="Despesa"
                      />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div>
                <Label className="text-xs mb-1 block">Categoria</Label>
                <Select
                  value={filters.categoria_id || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      categoria_id: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <IconBackground
                        icon="Globe"
                        color="#45b6fe"
                        text="Todas"
                      />
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <IconBackground
                          icon={category.icone as keyof typeof LucideIcons}
                          color={category.cor}
                          text={category.nome}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs mb-1 block">Status</Label>
                <Select
                  value={
                    filters.pago === undefined
                      ? "all"
                      : filters.pago
                        ? "true"
                        : "false"
                  }
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      pago: value === "all" ? undefined : value === "true",
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <IconBackground
                        icon="Globe"
                        color="#45b6fe"
                        text="Todos"
                      />
                    </SelectItem>
                    <SelectItem value="true">
                      <IconBackground
                        //icon="CircleCheck"
                        icon="CircleDollarSignIcon"
                        color="#008000"
                        text="Pago"
                      />
                    </SelectItem>
                    <SelectItem value="false">
                      <IconBackground
                        //icon="CircleX"
                        icon="CircleDollarSignIcon"
                        color="#e24a4b"
                        text="Pendente"
                      />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cartão */}
              <div>
                <Label className="text-xs mb-1 block">Cartão</Label>
                <Select
                  value={filters.cartao_id || "all" || "noCard"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      cartao_id: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <IconBackground
                        icon="Globe"
                        color="#45b6fe"
                        text="Todos"
                      />
                    </SelectItem>
                    <SelectItem value="noCard">
                      <IconBackground
                        icon="CreditCard"
                        color="#e24a4b"
                        text="Sem cartão"
                      />
                    </SelectItem>
                    {creditCards.map((cartao) => (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        <IconBackground
                          icon="CreditCard"
                          color="#45b6fe"
                          text={cartao.descricao}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Limpar */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center ">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              Nenhum lançamento
            </h3>
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento encontrado para este período
            </p>
          </div>
        ) : (
          <div className="stat-card">
            <div className="text-xs text-muted-foreground mb-3">
              {filteredTransactions.length} lançamento(s)
            </div>

            <div className="space-y-4">
              {transactionsByDate.map((dayData) => (
                <div key={dayData.date} className="space-y-2">
                  {/* Agrupar por cartão */}
                  {Object.entries(dayData.cards).map(([cardKey, cardData]) => {
                    const isSemCartao = cardKey === "sem-cartao";
                    const isExpanded = expandedCards.has(
                      `${dayData.date}-${cardKey}`,
                    );

                    // Se for "sem cartão", renderizar direto as transações
                    if (isSemCartao) {
                      return (
                        <div
                          key={`${dayData.date}-${cardKey}`}
                          className="space-y-1"
                        >
                          {cardData.transactions.map((transaction) => {
                            const category = categories.find(
                              (c) => c.id === transaction.categoria_id,
                            );
                            const isIncome = transaction.tipo === "Receita";

                            return (
                              <div
                                key={transaction.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <IconBackground
                                    icon={
                                      category?.icone as keyof typeof LucideIcons
                                    }
                                    color={category?.cor}
                                    text=""
                                  />

                                  <div className="flex-1">
                                    <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                      {transaction.descricao}
                                      {transaction.fixa && (
                                        <Repeat className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </p>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
                                      {category && <span>{category.nome}</span>}
                                      <span className="hidden sm:inline">
                                        •
                                      </span>
                                      <span>
                                        {formatDate(transaction.data)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Value */}
                                  <span
                                    className={cn(
                                      "font-semibold text-xs min-w-[80px] text-right",
                                      isIncome ? "text-income" : "text-expense",
                                    )}
                                  >
                                    {isIncome ? "+" : "-"}
                                    {formatCurrency(transaction.valor)}
                                  </span>

                                  {/* Actions */}
                                  <div className="flex gap-0.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title={
                                        transaction.pago ? "Estornar" : "Pagar"
                                      }
                                      className={`h-6 w-6 transition-colors ${
                                        transaction.pago
                                          ? "text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600"
                                          : "text-gray-500 bg-gray-500/10 hover:bg-gray-500/20 hover:text-gray-600"
                                      }`}
                                      onClick={() => togglePago(transaction.id)}
                                    >
                                      <LucideIcons.CircleDollarSignIcon className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Editar"
                                      className="h-6 w-6 transition-colors text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-600"
                                      onClick={() => handleEdit(transaction)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Deletar"
                                      className="h-6 w-6 transition-colors text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600"
                                      onClick={() =>
                                        handleDeleteClick(transaction)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    // Se for cartão com transações, renderizar com agrupador
                    return (
                      <div key={`${dayData.date}-${cardKey}`}>
                        {/* Linha do cartão/total */}
                        <button
                          onClick={() => {
                            const key = `${dayData.date}-${cardKey}`;
                            const newExpanded = new Set(expandedCards);
                            if (newExpanded.has(key)) {
                              newExpanded.delete(key);
                            } else {
                              newExpanded.add(key);
                            }
                            setExpandedCards(newExpanded);
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors border border-secondary/30"
                        >
                          <div className="flex items-center gap-3 flex-1 text-left">
                            {cardData.transactions.length > 0 && (
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            )}
                            <CreditCard className="h-4 w-4 text-chart-1" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-foreground">
                                {cardData.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cardData.transactions.length} transação(ões)
                                {dayData.date &&
                                  ` • Vencimento: ${formatDate(dayData.date)}`}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "font-semibold text-sm min-w-[100px] text-right",
                              cardData.total >= 0
                                ? "text-income"
                                : "text-expense",
                            )}
                          >
                            {cardData.total >= 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(cardData.total))}
                          </span>
                        </button>

                        {/* Transações do cartão (expandível) */}
                        {isExpanded && (
                          <div className="space-y-1 mt-2 ml-4 pl-4 border-l border-secondary/30">
                            {cardData.transactions.map((transaction) => {
                              const category = categories.find(
                                (c) => c.id === transaction.categoria_id,
                              );
                              const isIncome = transaction.tipo === "Receita";

                              return (
                                <div
                                  key={transaction.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 hover:bg-secondary/60 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <IconBackground
                                      icon={
                                        category?.icone as keyof typeof LucideIcons
                                      }
                                      color={category?.cor}
                                      text=""
                                    />

                                    <div className="flex-1">
                                      <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                        {transaction.descricao}
                                        {transaction.fixa && (
                                          <Repeat className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </p>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
                                        {category && (
                                          <span>{category.nome}</span>
                                        )}
                                        <span className="hidden sm:inline">
                                          •
                                        </span>
                                        <span>
                                          {formatDate(transaction.data)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Value */}
                                    <span
                                      className={cn(
                                        "font-semibold text-xs min-w-[80px] text-right",
                                        isIncome
                                          ? "text-income"
                                          : "text-expense",
                                      )}
                                    >
                                      {isIncome ? "+" : "-"}
                                      {formatCurrency(transaction.valor)}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title={
                                          transaction.pago
                                            ? "Estornar"
                                            : "Pagar"
                                        }
                                        className={`h-6 w-6 transition-colors ${
                                          transaction.pago
                                            ? "text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600"
                                            : "text-gray-500 bg-gray-500/10 hover:bg-gray-500/20 hover:text-gray-600"
                                        }`}
                                        onClick={() =>
                                          togglePago(transaction.id)
                                        }
                                      >
                                        <LucideIcons.CircleDollarSignIcon className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Editar"
                                        className="h-6 w-6 transition-colors text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-600"
                                        onClick={() => handleEdit(transaction)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Deletar"
                                        className="h-6 w-6 transition-colors text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600"
                                        onClick={() =>
                                          handleDeleteClick(transaction)
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Linha de saldo projetado do dia */}
                  <div className="pt-2 border-t border-secondary/30 pl-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Saldo projetado: {formatDate(dayData.date)}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          dayData.projectedBalance >= 0
                            ? "text-income"
                            : "text-expense",
                        )}
                      >
                        {formatCurrency(dayData.projectedBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent className="sm:max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                O que deseja fazer com "{transactionToDelete?.descricao}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm("deletar")}
              >
                Deletar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm("deletar-futuras")}
              >
                Deletar futuras
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm("deletar-pendentes")}
              >
                Deletar pendentes
              </Button>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
