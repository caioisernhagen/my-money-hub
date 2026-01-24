import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useFinance } from "@/contexts/FinanceContext";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const [showFilters, setShowFilters] = useState(false);

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

  // Agrupar transações por data e calcular saldo projetado
  const transactionsByDate = useMemo(() => {
    const grouped: { [key: string]: Transaction[] } = {};
    const accountBalances: { [key: string]: number } = {};

    // Inicializar saldos das contas
    accounts.forEach((account) => {
      accountBalances[account.id] = account.saldo_inicial || 0;
    });

    // Agrupar por data (usando data de exibição correta)
    filteredTransactions.forEach((transaction) => {
      //transaction.data = obterDataExibicaoComMapa(transaction, creditCardsMap);
      const dateKey = transaction.data;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    // Ordenar datas conforme preferência do usuário
    const sortedDates = Object.keys(grouped);

    // Calcular saldo projetado para cada data
    const result: {
      date: string;
      transactions: Transaction[];
      projectedBalance: number;
    }[] = [];

    sortedDates.forEach((date) => {
      const dayTransactions = grouped[date] || [];
      let dayBalance = 0;

      dayTransactions.forEach((transaction) => {
        const value =
          transaction.tipo === "Receita"
            ? transaction.valor
            : -transaction.valor;
        dayBalance += value;
        accountBalances[transaction.conta_id] += value;
      });

      result.push({
        date,
        transactions: dayTransactions,
        projectedBalance: Object.values(accountBalances).reduce(
          (sum, bal) => sum + bal,
          0,
        ),
      });
    });

    return result;
  }, [filteredTransactions, accounts, sortBy]);

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

            {/* Novo Lançamento - Desktop */}
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 hidden sm:flex">
                  <Plus className="h-4 w-4" />
                  Novo Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="font-medium">
                    {editingTransaction
                      ? "Editar Lançamento"
                      : "Novo Lançamento"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Ex: Supermercado"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor</Label>
                      <Input
                        id="valor"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) =>
                          setFormData({ ...formData, valor: e.target.value })
                        }
                        onBlur={handleValorBlur}
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) =>
                          setFormData({ ...formData, data: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: TransactionType) =>
                        setFormData({
                          ...formData,
                          tipo: value,
                          categoria_id: "",
                        })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="conta">Conta</Label>
                      <Select
                        value={formData.conta_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, conta_id: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.ativo)
                            .map((account) => (
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
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select
                        value={formData.categoria_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, categoria_id: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.map((category) => {
                            return (
                              <SelectItem key={category.id} value={category.id}>
                                <IconBackground
                                  icon={
                                    category.icone as keyof typeof LucideIcons
                                  }
                                  color={category.cor}
                                  text={category.nome}
                                />
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="pago"
                        checked={formData.pago}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, pago: checked })
                        }
                      />
                      <Label htmlFor="pago" className="text-sm">
                        Pago
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="cartao"
                        checked={formData.cartao}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            cartao: checked,
                            cartao_id: "",
                            fatura_mes: "",
                            parcelas: "",
                          })
                        }
                      />
                      <Label htmlFor="cartao" className="text-sm">
                        Cartão
                      </Label>
                    </div>
                    {!editingTransaction && (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="fixa"
                          checked={formData.fixa}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, fixa: checked })
                          }
                        />
                        <Label htmlFor="fixa" className="text-sm">
                          Repetir (36x)
                        </Label>
                      </div>
                    )}
                  </div>

                  {formData.cartao && (
                    <div className="p-3 rounded-xl bg-secondary/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Cartão</Label>
                          <Select
                            value={formData.cartao_id}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                cartao_id: value,
                                fatura_mes: "",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {creditCards.map((card) => (
                                <SelectItem key={card.id} value={card.id}>
                                  {card.descricao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fatura</Label>
                          <Select
                            value={formData.fatura_mes}
                            onValueChange={(value) =>
                              setFormData({ ...formData, fatura_mes: value })
                            }
                            disabled={!formData.cartao_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {faturaOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {!editingTransaction && (
                        <div className="space-y-2">
                          <Label>Parcelar em</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="2"
                              max="48"
                              value={formData.parcelas}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  parcelas: e.target.value,
                                })
                              }
                              placeholder="Ex: 12"
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">
                              vezes
                            </span>
                            {formData.parcelas &&
                              parseInt(formData.parcelas) > 1 && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatCurrency(
                                    (parseFloat(formData.valor) || 0) /
                                      parseInt(formData.parcelas),
                                  )}
                                  /parcela
                                </span>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!editingTransaction && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Criar Lançamento"
                      )}
                    </Button>
                  )}
                  {editingTransaction && (
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="flex-1"
                        value="salvar"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="flex-1"
                        value="salvar-futuras"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar futuras"
                        )}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="flex-1"
                        value="salvar-pendentes"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar pendentes"
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros Expansíveis */}
          {showFilters && (
            <div className="stat-card grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 rounded-lg bg-secondary/30 border border-secondary/50">
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

          {/* Novo Lançamento - Mobile (aparece depois dos filtros) */}
          <div className="flex sm:hidden">
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 w-full">
                  <Plus className="h-4 w-4" />
                  Novo Lançamento
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
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

            <div className="space-y-0.5">
              {transactionsByDate.map((dayData) => (
                <div key={dayData.date}>
                  {/* Transações do dia */}
                  <div className="space-y-1">
                    {dayData.transactions.map((transaction) => {
                      const category = categories.find(
                        (c) => c.id === transaction.categoria_id,
                      );
                      // const account = accounts.find(
                      //   (a) => a.id === transaction.conta_id,
                      // );
                      const isIncome = transaction.tipo === "Receita";

                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-1.5 rounded-xl bg-secondary/30 hover:bg-secondary/90 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <IconBackground
                              icon={category?.icone as keyof typeof LucideIcons}
                              color={category?.cor}
                              text=""
                            />

                            <div>
                              <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                {transaction.descricao}
                                {transaction.fixa && (
                                  <Repeat className="h-3 w-3 text-muted-foreground" />
                                )}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-muted-foreground">
                                {category && (
                                  <div className="flex items-center gap-1">
                                    <span>{category.nome}</span>
                                  </div>
                                )}
                                <span className="hidden sm:inline">•</span>
                                <span>
                                  {formatDate(transaction.data)}
                                  {/* {formatDate(
                                    obterDataExibicaoTransacao(transaction),
                                  )} */}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status badges */}
                            <div className="flex items-center gap-1">
                              {transaction.cartao && (
                                <span className="flex items-center px-1.5 py-0.5 rounded text-xs text-chart-1">
                                  <CreditCard className="h-4 w-4" />
                                </span>
                              )}
                            </div>

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
                                title={transaction.pago ? "Estornar" : "Pagar"}
                                className={`h-7 w-7 transition-colors ${
                                  transaction.pago
                                    ? "text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600"
                                    : "text-gray-500 bg-gray-500/10 hover:bg-gray-500/20 hover:text-gray-600"
                                }`}
                                onClick={() => togglePago(transaction.id)}
                              >
                                <LucideIcons.CircleDollarSignIcon className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar"
                                className="h-7 w-7 transition-colors text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-600"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Deletar"
                                className="h-7 w-7 transition-colors text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600"
                                onClick={() => handleDeleteClick(transaction)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Linha de saldo projetado do dia */}
                  <div className="mt-2 pt-2 border-t border-secondary/50 pl-12">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Saldo projetado em {formatDate(dayData.date)}:
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
