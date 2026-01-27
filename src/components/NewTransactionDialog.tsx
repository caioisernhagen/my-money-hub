import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Loader2 } from "lucide-react";
import { IconBackground } from "@/components/IconBackground";
import { Transaction, TransactionType, CreditCard } from "@/types/finance";
import { toast } from "sonner";
import { format, addMonths, startOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as LucideIcons from "lucide-react";

interface NewTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<boolean>;
  onUpdate?: (id: string, data: any, action: string) => Promise<boolean>;
  categories: Array<{
    id: string;
    nome: string;
    tipo: TransactionType;
    cor?: string;
    icone?: string;
  }>;
  accounts: Array<{ id: string; nome: string; ativo?: boolean }>;
  creditCards: CreditCard[];
  trigger?: React.ReactNode;
  editingTransaction?: Transaction | null;
  showTrigger?: boolean;
}

export function NewTransactionDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onUpdate,
  categories,
  accounts,
  creditCards,
  trigger,
  editingTransaction,
  showTrigger = true,
}: NewTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const defaultContaId = accounts?.[0]?.id || "";
  const firstCategoryOf = (tipo: TransactionType) =>
    categories.find((c) => c.tipo === tipo)?.id || "";

  const [formData, setFormData] = useState(() => ({
    descricao: "",
    valor: "",
    data: today,
    tipo: "Despesa" as TransactionType,
    conta_id: defaultContaId,
    categoria_id: firstCategoryOf("Despesa"),
    pago: false,
    cartao: false,
    cartao_id: "",
    fatura_mes: "",
    fixa: false,
    parcelas: "",
  }));

  // When editingTransaction changes, populate form; otherwise reset defaults
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        descricao: editingTransaction.descricao || "",
        valor: (editingTransaction.valor ?? 0).toString(),
        data: editingTransaction.data || today,
        tipo: editingTransaction.tipo,
        conta_id: editingTransaction.conta_id || defaultContaId,
        categoria_id:
          editingTransaction.categoria_id ||
          firstCategoryOf(editingTransaction.tipo),
        pago: !!editingTransaction.pago,
        cartao: !!editingTransaction.cartao,
        cartao_id: editingTransaction.cartao_id || "",
        fatura_mes: editingTransaction.fatura_mes || "",
        fixa: !!editingTransaction.fixa,
        parcelas: editingTransaction.parcelas
          ? String(editingTransaction.parcelas)
          : "",
      });
    } else {
      setFormData({
        descricao: "",
        valor: "",
        data: today,
        tipo: "Despesa",
        conta_id: defaultContaId,
        categoria_id: firstCategoryOf("Despesa"),
        pago: false,
        cartao: false,
        cartao_id: "",
        fatura_mes: "",
        fixa: false,
        parcelas: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction, categories, accounts]);

  // Filter categories by tipo
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.tipo === formData.tipo);
  }, [categories, formData.tipo]);

  // When tipo changes and we're CREATING (not editing), reset category to first of new tipo
  useEffect(() => {
    // Sempre que o tipo mudar, atualiza a categoria para a primeira do tipo
    const first = filteredCategories[0]?.id || "";
    setFormData((prev) => ({ ...prev, categoria_id: first }));
  }, [formData.tipo, filteredCategories]);

  const resetForm = () => {
    setFormData({
      descricao: "",
      valor: "",
      data: today,
      tipo: "Despesa",
      conta_id: defaultContaId,
      categoria_id: firstCategoryOf("Despesa"),
      pago: false,
      cartao: false,
      cartao_id: "",
      fatura_mes: "",
      fixa: false,
      parcelas: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
    }
  };

  const handleValorBlur = () => {
    // Evaluate simple math like 10+5
    if (/[+\-*/]/.test(formData.valor)) {
      try {
        if (!/^[\d\s+\-*/.()]+$/.test(formData.valor)) return;
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${formData.valor})`)();
        if (typeof result === "number" && !isNaN(result)) {
          setFormData((prev) => ({ ...prev, valor: String(result) }));
        }
      } catch (_) {
        // ignore
      }
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const faturaOptions = useMemo(() => {
    if (!formData.cartao || !formData.cartao_id || !formData.data)
      return [] as { value: string; label: string }[];
    const card = creditCards.find((c) => c.id === formData.cartao_id);
    if (!card) return [];
    const transactionDate = parseISO(formData.data);
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const faturaMonth = addMonths(startOfMonth(transactionDate), i + 1);
      const faturaDate = format(faturaMonth, "yyyy-MM");
      const label = format(faturaMonth, "MMMM'/'yyyy", { locale: ptBR });
      options.push({ value: faturaDate, label });
    }
    return options;
  }, [formData.cartao, formData.cartao_id, formData.data, creditCards]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitter = (e.nativeEvent as any).submitter as
      | HTMLButtonElement
      | undefined;
    const action = submitter?.value || "salvar";

    const transactionData = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor.replace(/,/g, ".")) || 0,
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

    let success = false;
    try {
      if (editingTransaction && onUpdate) {
        success = await onUpdate(
          editingTransaction.id,
          transactionData,
          action,
        );
      } else {
        success = await onSubmit(transactionData);
      }
    } catch (err) {
      success = false;
    }

    if (success) {
      toast.success(
        editingTransaction ? "Lançamento atualizado!" : "Lançamento criado!",
      );
      handleOpenChange(false);
    }

    setIsSubmitting(false);
  };

  //const defaultTrigger = showTrigger ? (
  //   <Button className="gap-2">
  //     <Plus className="h-6 w-6" />
  //     Novo Lançamento
  //   </Button>
  // ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-medium">
            {!editingTransaction || editingTransaction === null
              ? "Novo Lançamento"
              : "Editar Lançamento"}
          </DialogTitle>
          <DialogDescription>
            {!editingTransaction || editingTransaction === null
              ? "Criar uma nova transação"
              : "Editar a transação selecionada"}
          </DialogDescription>
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
                setFormData({ ...formData, tipo: value })
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
                    .filter((a) => a.ativo ?? true)
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
                  {filteredCategories.map((category) => (
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
                    cartao_id: checked ? formData.cartao_id : "",
                    fatura_mes: checked ? formData.fatura_mes : "",
                    parcelas: checked ? formData.parcelas : "",
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
                      min={2}
                      max={48}
                      value={formData.parcelas}
                      onChange={(e) =>
                        setFormData({ ...formData, parcelas: e.target.value })
                      }
                      placeholder="Ex: 12"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">vezes</span>
                    {formData.parcelas && parseInt(formData.parcelas) > 1 && (
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
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
  );
}
