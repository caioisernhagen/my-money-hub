import { CreditCard, InvoiceInfo } from "@/types/finance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface InvoiceDetailsDialogProps {
  invoice: InvoiceInfo | null;
  creditCard: CreditCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsDialog({
  invoice,
  creditCard,
  open,
  onOpenChange,
}: InvoiceDetailsDialogProps) {
  if (!invoice || !creditCard) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pago":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "parcial":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "pendente":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
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

  const totalPago = invoice.transacoes
    .filter((t) => t.pago)
    .reduce((sum, t) => sum + t.valor, 0);

  const totalPendente = invoice.valor_total - totalPago;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-80 max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 mt-3 text-ms">
            Fatura de {invoice.label}
            <Badge className={getStatusColor(invoice.status)}>
              {getStatusLabel(invoice.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-xs">
          {/* Informações da Fatura */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Cartão</p>
                <p className="font-semibold">{creditCard.descricao}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fatura</p>
                <p className="font-semibold">{invoice.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fechamento</p>
                <p className="font-semibold">
                  {format(
                    new Date(invoice.data_fechamento + "T12:00:00"),
                    "dd 'de' MMMM",
                    {
                      locale: ptBR,
                    },
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Vencimento</p>
                <p className="font-semibold">
                  {format(
                    new Date(invoice.data_vencimento + "T12:00:00"),
                    "dd 'de' MMMM",
                    {
                      locale: ptBR,
                    },
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Resumo de Valores */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Total da Fatura</span>
              <span className="font-semibold text-xs">
                {formatCurrency(invoice.valor_total)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Pago
              </span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totalPago)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Pendente
              </span>
              <span className="font-semibold text-red-600">
                {formatCurrency(totalPendente)}
              </span>
            </div>
          </div>

          {/* Lista de Transações */}
          <div className="space-y-2 text-xs">
            <h3 className="font-semibold text-xs text-gray-700">
              Transações ({invoice.transacoes.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invoice.transacoes.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  Nenhuma transação nesta fatura
                </p>
              ) : (
                invoice.transacoes.map((transacao) => (
                  <div
                    key={transacao.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {transacao.descricao}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(transacao.valor)}
                      </span>
                      {transacao.pago ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
