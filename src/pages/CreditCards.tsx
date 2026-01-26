import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard as CardIcon,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CreditCard } from "@/types/finance";
import { toast } from "sonner";
import { format, startOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function CreditCards() {
  const {
    creditCards,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  } = useCreditCards();
  const { transactions } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    data_vencimento: "",
    data_fechamento: "",
    limite: "",
  });

  // Calcular faturas por cartão
  const getCardInvoices = (cardId: string) => {
    const cardTransactions = transactions.filter(
      (t) => t.cartao_id === cardId && t.fatura_mes,
    );
    const invoices: { [key: string]: number } = {};

    cardTransactions.forEach((t) => {
      if (t.fatura_mes) {
        if (!invoices[t.fatura_mes]) invoices[t.fatura_mes] = 0;
        invoices[t.fatura_mes] += t.valor;
      }
    });

    // Ordenar por data e retornar
    return Object.entries(invoices)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, valor]) => ({
        date,
        label: format(new Date(date + "T12:00:00"), "MMMM 'de' yyyy", {
          locale: ptBR,
        }),
        valor,
      }));
  };

  // Calcular fatura atual
  const getCurrentInvoiceTotal = (cardId: string) => {
    const currentMonth = format(
      addMonths(startOfMonth(new Date()), +1),
      "yyyy-MM",
    );
    const cardTransactions = transactions.filter(
      (t) => t.cartao_id === cardId && t.fatura_mes === currentMonth,
    );
    return cardTransactions.reduce((sum, t) => sum + t.valor, 0);
  };
  // Calcular fatura total
  const getInvoiceTotal = (cardId: string) => {
    const cardTransactions = transactions.filter((t) => t.cartao_id === cardId);
    return cardTransactions.reduce((sum, t) => sum + t.valor, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      descricao: "",
      data_vencimento: "",
      data_fechamento: "",
      limite: "",
    });
    setEditingCard(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (card: CreditCard) => {
    setEditingCard(card);
    setFormData({
      descricao: card.descricao,
      data_vencimento: card.data_vencimento.toString(),
      data_fechamento: card.data_fechamento.toString(),
      limite: card.limite.toString(),
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const cardData = {
      descricao: formData.descricao,
      data_vencimento: parseInt(formData.data_vencimento) || 1,
      data_fechamento: parseInt(formData.data_fechamento) || 1,
      limite: parseFloat(formData.limite) || 0,
    };

    if (editingCard) {
      const success = await updateCreditCard(editingCard.id, cardData);
      if (success) {
        toast.success("Cartão atualizado!");
        handleOpenChange(false);
      }
    } else {
      const result = await addCreditCard(cardData);
      if (result) {
        toast.success("Cartão criado!");
        handleOpenChange(false);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCreditCard(id);
    if (success) {
      toast.success("Cartão excluído!");
    }
  };

  if (loading) {
    return (
      <MainLayout title="Cartões" subtitle="Gerencie seus cartões de crédito">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20 lg:pb-0">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Cartões"
      subtitle="Gerencie seus cartões de crédito"
      headerActions={
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center z-50"
          title="Nova Categoria"
        >
          <Plus className="h-6 w-6" />
        </Button>
      }
    >
      <div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="font-medium">
                {editingCard ? "Editar Cartão" : "Novo Cartão"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Nome</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Ex: Nubank"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fechamento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.data_fechamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_fechamento: e.target.value,
                      })
                    }
                    placeholder="8"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.data_vencimento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_vencimento: e.target.value,
                      })
                    }
                    placeholder="15"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Limite (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.limite}
                  onChange={(e) =>
                    setFormData({ ...formData, limite: e.target.value })
                  }
                  placeholder="5000,00"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingCard ? (
                  "Salvar"
                ) : (
                  "Criar Cartão"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CardIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">
            Nenhum cartão
          </h3>
          <p className="text-sm text-muted-foreground">
            Comece adicionando seu primeiro cartão
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20 lg:pb-0">
          {creditCards.map((card) => {
            const currentInvoice = getCurrentInvoiceTotal(card.id);
            const totalInvoice = getInvoiceTotal(card.id);
            const invoices = getCardInvoices(card.id);
            const isExpanded = expandedCard === card.id;
            const disponivel = card.limite - totalInvoice;

            return (
              <div key={card.id} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5">
                    <CardIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(card)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-medium text-foreground mb-3">
                  {card.descricao}
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limite</span>
                    <span className="font-medium">
                      {formatCurrency(card.limite)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fatura Atual</span>
                    <span className="font-medium text-expense">
                      {formatCurrency(currentInvoice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponível</span>
                    <span
                      className={cn(
                        "font-medium",
                        disponivel >= 0 ? "text-income" : "text-expense",
                      )}
                    >
                      {formatCurrency(disponivel)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Fecha dia {card.data_fechamento}</span>
                    <span>Vence dia {card.data_vencimento}</span>
                  </div>
                </div>

                {invoices.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setExpandedCard(isExpanded ? null : card.id)
                      }
                    >
                      <span>Faturas ({invoices.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-1">
                        {invoices.map((invoice) => (
                          <div
                            key={invoice.date}
                            className="flex justify-between text-xs py-1"
                          >
                            <span className="capitalize">{invoice.label}</span>
                            <span className="font-medium">
                              {formatCurrency(invoice.valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
