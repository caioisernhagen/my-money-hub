import { CreditCard, Transaction, InvoiceInfo } from "@/types/finance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard as CardIcon, Calendar } from "lucide-react";
import {
  gerarInfoFatura,
  agruparTransacoesPorFatura,
  formatarMesFatura,
} from "@/lib/creditCardHelpers";
import { useState } from "react";
import { InvoiceDetailsDialog } from "@/components/InvoiceDetailsDialog";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FutureInvoicesProps {
  creditCards: CreditCard[];
  transactions: Transaction[];
  mesesAMostrar?: number;
}

export function FutureInvoices({
  creditCards,
  transactions,
  mesesAMostrar = 3,
}: FutureInvoicesProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(
    null,
  );
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800";
      case "parcial":
        return "bg-yellow-100 text-yellow-800";
      case "pendente":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pago":
        return "Pago";
      case "parcial":
        return "Parcial";
      case "pendente":
        return "Pendente";
      default:
        return status;
    }
  };

  const handleOpenInvoice = (invoice: InvoiceInfo, card: CreditCard) => {
    setSelectedInvoice(invoice);
    setSelectedCard(card);
    setDialogOpen(true);
  };

  // Gerar meses a partir do mês atual
  const mesesFuturos = Array.from({ length: mesesAMostrar }, (_, i) => {
    return format(addMonths(new Date(), i), "yyyy-MM");
  });

  // Se não há transações de cartão, não mostra
  const temTransacoesCartao = transactions.some(
    (t) => t.cartao && t.fatura_mes,
  );
  if (!temTransacoesCartao) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Próxima Fatura</h2>
          <p className="text-sm text-gray-500">
            Lançamentos que serão cobrados no próximo mês
          </p>
        </div>

        {creditCards.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center">
                Nenhum cartão cadastrado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => {
              const faturasMapa = agruparTransacoesPorFatura(
                transactions,
                card.id,
              );

              const proximaFatura = mesesFuturos.find((mes) =>
                faturasMapa.has(mes),
              );

              if (!proximaFatura) {
                return (
                  <Card key={card.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CardIcon className="w-4 h-4" />
                            {card.descricao}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Nenhuma fatura em aberto
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              const invoiceInfo = gerarInfoFatura(
                proximaFatura,
                card,
                transactions,
              );

              return (
                <Card key={card.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CardIcon className="w-4 h-4" />
                          {card.descricao}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {invoiceInfo.label}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(invoiceInfo.status)}>
                        {getStatusLabel(invoiceInfo.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold">
                          {formatCurrency(invoiceInfo.valor_total)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fechamento</span>
                        <span className="font-semibold text-sm">
                          {format(
                            new Date(invoiceInfo.data_fechamento + "T12:00:00"),
                            "dd/MM/yyyy",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vencimento</span>
                        <span className="font-semibold text-sm">
                          {format(
                            new Date(invoiceInfo.data_vencimento + "T12:00:00"),
                            "dd/MM/yyyy",
                          )}
                        </span>
                      </div>
                    </div>

                    {invoiceInfo.transacoes.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">
                          {invoiceInfo.transacoes.length} transação
                          {invoiceInfo.transacoes.length > 1 ? "ões" : ""}
                        </p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenInvoice(invoiceInfo, card)}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        creditCard={selectedCard}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
