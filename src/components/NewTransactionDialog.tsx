import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Loader2 } from "lucide-react";
import { IconBackground } from "@/components/IconBackground";
import { Transaction, TransactionType } from "@/types/finance";
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

interface NewTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<boolean>;
  categories: any[];
  accounts: any[];
  creditCards: any[];
  trigger?: React.ReactNode;
  editingTransaction?: Transaction | null;
  showTrigger?: boolean;
}

export function NewTransactionDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  categories,
  accounts,
  creditCards,
  trigger,
  editingTransaction,
  showTrigger = true,
}: NewTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    descricao: editingTransaction?.descricao || "",
    valor: editingTransaction?.valor.toString() || "",
    data: editingTransaction?.data || format(new Date(), "yyyy-MM-dd"),
    tipo: (editingTransaction?.tipo || "Despesa") as TransactionType,
    conta_id: editingTransaction?.conta_id || accounts[0]?.id || "",
    categoria_id: editingTransaction?.categoria_id || "",
    pago: editingTransaction?.pago || false,
    cartao: editingTransaction?.cartao || false,
    cartao_id: editingTransaction?.cartao_id || "",
    fatura_mes: editingTransaction?.fatura_mes || "",
    fixa: editingTransaction?.fixa || false,
    parcelas: "",
  });

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
    }
  };

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
  };

  const handleValorBlur = () => {
    if (/[\+\-\*\/]/.test(formData.valor)) {
      try {
        if (!/^[\d\s\+\-\*\/\.]+$/.test(formData.valor)) {
          return;
        }
        const result = Function(
          '"use strict"; return (' + formData.valor + ")",
        )();
        if (typeof result === "number" && !isNaN(result)) {
          setFormData({ ...formData, valor: result.toString() });
        }
      } catch {
        // Se há erro na avaliação, mantém o valor como está
      }
    }
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
      fatura_mes: formData.cartao ? formData.fatura_mes || null : null,
      fixa: formData.fixa,
      parcelas:
        formData.cartao && formData.parcelas
          ? parseInt(formData.parcelas)
          : null,
    };

    const success = await onSubmit(transactionData);
    if (success) {
      toast.success(
        editingTransaction ? "Lançamento atualizado!" : "Lançamento criado!",
      );
      handleOpenChange(false);
    }

    setIsSubmitting(false);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.tipo === formData.tipo);
  }, [categories, formData.tipo]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

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

  const defaultTrigger = showTrigger ? (
    <Button className="gap-2">
      <Plus className="h-6 w-6" />
      Novo Lançamento
    </Button>
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {(trigger || defaultTrigger) && (
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      )}
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
                          icon={category.icone as keyof typeof LucideIcons}
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
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
