import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CreditCard as CardIcon, Calendar } from 'lucide-react';
import { CreditCard } from '@/types/finance';
import { toast } from 'sonner';

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([
    { id: '1', descricao: 'Nubank', data_vencimento: 15, data_fechamento: 8 },
    { id: '2', descricao: 'Itaú Platinum', data_vencimento: 20, data_fechamento: 13 },
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cardData = {
      descricao: formData.descricao,
      data_vencimento: parseInt(formData.data_vencimento) || 1,
      data_fechamento: parseInt(formData.data_fechamento) || 1,
    };

    if (editingCard) {
      setCards(prev => prev.map(c => 
        c.id === editingCard.id ? { ...c, ...cardData } : c
      ));
      toast.success('Cartão atualizado com sucesso!');
    } else {
      setCards(prev => [...prev, { ...cardData, id: Date.now().toString() }]);
      toast.success('Cartão criado com sucesso!');
    }

    handleOpenChange(false);
  };

  const handleDelete = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    toast.success('Cartão excluído com sucesso!');
  };

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

              <Button type="submit" className="w-full">
                {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 lg:pb-0">
        {cards.map((card) => (
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
    </MainLayout>
  );
}
