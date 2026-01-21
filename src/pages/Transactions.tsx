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
  Filter,
  CreditCard,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
  Receipt,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Transaction,
  TransactionType,
  TransactionFilters,
} from "@/types/finance";
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
    toggleCartao,
    filterTransactions,
  } = useFinance();

  const { creditCards } = useCreditCards();

  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [filters, setFilters] = useState<TransactionFilters>({});

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
    fatura_data: "",
    fixa: false,
    parcelas: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy");
  };

  // Filtro por mês selecionado + filtros adicionais
  const filteredTransactions = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthFilters: TransactionFilters = {
      ...filters,
      dataInicio: format(monthStart, "yyyy-MM-dd"),
      dataFim: format(monthEnd, "yyyy-MM-dd"),
    };

    return filterTransactions(monthFilters);
  }, [filterTransactions, filters, selectedDate]);

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
      fatura_data: "",
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

    for (let i = 0; i < 6; i++) {
      const faturaMonth = addMonths(startOfMonth(transactionDate), i);
      const faturaDate = format(faturaMonth, "yyyy-MM-01");
      const label = format(faturaMonth, "MMMM 'de' yyyy", { locale: ptBR });
      options.push({ value: faturaDate, label: `Fatura de ${label}` });
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
      fatura_data: transaction.fatura_data || "",
      fixa: transaction.fixa || false,
      parcelas: "",
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      fatura_data: formData.cartao ? formData.fatura_data || null : null,
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

  const handleDelete = async (id: string) => {
    const success = await deleteTransaction(id);
    if (success) {
      toast.success("Lançamento excluído!");
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, v]) =>
      key !== "dataInicio" && key !== "dataFim" && v !== undefined && v !== "",
  );

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

      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="font-medium">
                  Filtrar Lançamentos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select
                    value={filters.conta_id || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        conta_id: value === "all" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={filters.categoria_id || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        categoria_id: value === "all" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: category.cor }}
                            />
                            {category.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Pago</SelectItem>
                        <SelectItem value="false">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cartão</Label>
                    <Select
                      value={
                        filters.cartao === undefined
                          ? "all"
                          : filters.cartao
                            ? "true"
                            : "false"
                      }
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          cartao:
                            value === "all" ? undefined : value === "true",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Cartão</SelectItem>
                        <SelectItem value="false">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearFilters}
                  >
                    Limpar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="font-medium">
                {editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}
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
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
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
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.ativo)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.nome}
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => {
                        // 1. Transformamos a string/referência em um Componente (Letra Maiúscula)
                        const IconeCategoria =
                          LucideIcons[category.icone] || LucideIcons.HelpCircle;

                        return (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-3">
                              {/* 2. Container do ícone com o fundo colorido e opacidade */}
                              <div
                                className="flex items-center justify-center w-7 h-7 rounded-md"
                                style={{ backgroundColor: `${category.cor}1A` }}
                              >
                                <IconeCategoria
                                  size={16}
                                  style={{ color: category.cor }}
                                />
                              </div>

                              {/* 3. Nome da categoria */}
                              <span className="text-sm font-medium">
                                {category.nome}
                              </span>
                            </div>
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
                        fatura_data: "",
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
                      Fixa
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
                            fatura_data: "",
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
                        value={formData.fatura_data}
                        onValueChange={(value) =>
                          setFormData({ ...formData, fatura_data: value })
                        }
                        disabled={!formData.cartao_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {faturaOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingTransaction ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Lançamento"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
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
        <div className="stat-card pb-20 lg:pb-0">
          <div className="text-xs text-muted-foreground mb-3">
            {filteredTransactions.length} lançamento(s)
          </div>

          <div className="space-y-1.5">
            {filteredTransactions.map((transaction) => {
              const category = categories.find(
                (c) => c.id === transaction.categoria_id,
              );
              const IconeDinamico = LucideIcons[category.icone];
              const account = accounts.find(
                (a) => a.id === transaction.conta_id,
              );
              const isIncome = transaction.tipo === "Receita";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <IconeDinamico
                      className="w-4.5 h-4.5"
                      style={{ color: category.cor }}
                    />
                    <div>
                      <p className="font-medium text-sm text-foreground flex items-center gap-1.5">
                        {transaction.descricao}
                        {transaction.fixa && (
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {category && (
                          <div className="flex items-center gap-1">
                            {/* <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: category.cor }}
                            /> */}
                            <span>{category.nome}</span>
                          </div>
                        )}
                        <span>•</span>
                        <span>{formatDate(transaction.data)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badges */}
                    <div className="flex items-center gap-1">
                      {transaction.cartao && (
                        <span className="flex items-center px-1.5 py-0.5 rounded text-xs bg-chart-1/10 text-chart-1">
                          <CreditCard className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    {/* Value */}
                    <span
                      className={cn(
                        "font-semibold text-sm min-w-[80px] text-right",
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
                        className={`h-7 w-7 transition-colors ${
                          transaction.pago
                            ? "text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600"
                            : "text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600"
                        }`}
                        onClick={() => togglePago(transaction.id)}
                      >
                        <LucideIcons.Banknote className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
