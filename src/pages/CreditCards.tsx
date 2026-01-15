import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCreditCards } from '@/hooks/useCreditCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CreditCard as CardIcon, Calendar, Loader2 } from 'lucide-react';
import { CreditCard } from '@/types/finance';
import { toast } from 'sonner';

export default function CreditCards() {
  const { creditCards, loading, addCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    data_vencimento: '',
    data_fechamento: '',
  });

  const resetForm = () => {
    setFormData({ descricao: '', data_vencimento: '', data_fechamento: '' });
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
    };

    if (editingCard) {
      const success = await updateCreditCard(editingCard.id, cardData);
      if (success) {
        toast.success('Cartão atualizado com sucesso!');
        handleOpenChange(false);
      }
    } else {
      const result = await addCreditCard(cardData);
      if (result) {
        toast.success('Cartão criado com sucesso!');
        handleOpenChange(false);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCreditCard(id);
    if (success) {
      toast.success('Cartão excluído com sucesso!');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Cartões de Crédito" subtitle="Gerencie seus cartões de crédito">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 lg:pb-0">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cartões de Crédito" subtitle="Gerencie seus cartões de crédito">
      <div className="flex justify-end mb-6">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Nome do Cartão</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Nubank"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechamento">Dia de Fechamento</Label>
                  <Input
                    id="fechamento"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.data_fechamento}
                    onChange={(e) => setFormData({ ...formData, data_fechamento: e.target.value })}
                    placeholder="8"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vencimento">Dia de Vencimento</Label>
                  <Input
                    id="vencimento"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    placeholder="15"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingCard ? 'Salvar Alterações' : 'Criar Cartão'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CardIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro cartão</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 lg:pb-0">
          {creditCards.map((card) => (
            <div key={card.id} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-5">
                  <CardIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(card)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold text-foreground text-lg mb-4">{card.descricao}</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Fechamento</span>
                  </div>
                  <span className="font-semibold">Dia {card.data_fechamento}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Vencimento</span>
                  </div>
                  <span className="font-semibold">Dia {card.data_vencimento}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
