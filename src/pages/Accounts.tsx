import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  TrendingUp,
  PiggyBank,
  Landmark,
  DollarSign,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Account, AccountType } from "@/types/finance";
import { toast } from "sonner";

const accountTypes: AccountType[] = [
  "Corrente",
  "Poupança",
  "Investimento",
  "Carteira",
  "Outro",
];

const accountIcons = {
  Corrente: Landmark,
  Poupança: PiggyBank,
  Investimento: TrendingUp,
  Carteira: Wallet,
  Outro: DollarSign,
};

export default function Accounts() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,
    loading,
  } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Corrente" as AccountType,
    saldo_inicial: "",
    ativo: true,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const resetForm = () => {
    setFormData({ nome: "", tipo: "Corrente", saldo_inicial: "", ativo: true });
    setEditingAccount(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      nome: account.nome,
      tipo: account.tipo,
      saldo_inicial: account.saldo_inicial.toString(),
      ativo: account.ativo,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const accountData = {
      nome: formData.nome,
      tipo: formData.tipo,
      saldo_inicial: parseFloat(formData.saldo_inicial) || 0,
      ativo: formData.ativo,
    };

    if (editingAccount) {
      const success = await updateAccount(editingAccount.id, accountData);
      if (success) {
        toast.success("Conta atualizada com sucesso!");
        handleOpenChange(false);
      }
    } else {
      const result = await addAccount(accountData);
      if (result) {
        toast.success("Conta criada com sucesso!");
        handleOpenChange(false);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (account: Account) => {
    const success = await deleteAccount(account.id);
    if (success) {
      toast.success("Conta excluída com sucesso!");
    }
  };

  if (loading) {
    return (
      <MainLayout
        title="Contas"
        subtitle="Gerencie suas contas bancárias e carteiras"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 lg:pb-0">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Contas"
      subtitle="Gerencie suas contas bancárias e carteiras"
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingAccount ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Conta</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Conta Corrente Itaú"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: AccountType) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saldo_inicial">Saldo Inicial</Label>
                <Input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  value={formData.saldo_inicial}
                  onChange={(e) =>
                    setFormData({ ...formData, saldo_inicial: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Conta Ativa</Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingAccount ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma conta cadastrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando sua primeira conta
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 lg:pb-0">
          {accounts.map((account) => {
            const balance = getAccountBalance(account.id);
            const Icon = accountIcons[account.tipo] || Wallet;

            return (
              <div
                key={account.id}
                className={cn(
                  "stat-card relative",
                  !account.ativo && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      className="h-8 w-8 transition-colors text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-600"
                      onClick={() => handleEdit(account)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Deletar"
                      className="h-8 w-8 ml-2 transition-colors text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600"
                      onClick={() => handleDelete(account)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-1">
                  {account.nome}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {account.tipo}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Saldo Inicial:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(account.saldo_inicial)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Saldo Atual:
                    </span>
                    <span
                      className={cn(
                        "font-display font-bold text-lg",
                        balance >= 0 ? "text-income" : "text-expense",
                      )}
                    >
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>

                {!account.ativo && (
                  <div className="absolute top-3 right-16 px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                    Inativa
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
