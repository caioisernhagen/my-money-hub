import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category, TransactionType } from '@/types/finance';
import { toast } from 'sonner';

const categoryColors = [
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#64748b'
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Despesa' as TransactionType,
    cor: '#3b82f6',
  });

  const resetForm = () => {
    setFormData({ nome: '', tipo: 'Despesa', cor: '#3b82f6' });
    setEditingCategory(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nome: category.nome,
      tipo: category.tipo,
      cor: category.cor,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
      toast.success('Categoria atualizada com sucesso!');
    } else {
      addCategory(formData);
      toast.success('Categoria criada com sucesso!');
    }

    handleOpenChange(false);
  };

  const handleDelete = (category: Category) => {
    const success = deleteCategory(category.id);
    if (success) {
      toast.success('Categoria excluída com sucesso!');
    } else {
      toast.error('Não é possível excluir uma categoria com lançamentos associados');
    }
  };

  const incomeCategories = categories.filter(c => c.tipo === 'Receita');
  const expenseCategories = categories.filter(c => c.tipo === 'Despesa');

  return (
    <MainLayout title="Categorias" subtitle="Organize suas receitas e despesas por categoria">
      <div className="flex justify-end mb-6">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Alimentação"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: TransactionType) => setFormData({ ...formData, tipo: value })}
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

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="grid grid-cols-9 gap-2">
                  {categoryColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-lg transition-all",
                        formData.cor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, cor: color })}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8 pb-20 lg:pb-0">
        {/* Receitas */}
        <div>
          <h2 className="text-lg font-display font-semibold text-income mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-income" />
            Categorias de Receita
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {incomeCategories.map((category) => (
              <div
                key={category.id}
                className="stat-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.cor}20` }}
                  >
                    <Tag className="h-5 w-5" style={{ color: category.cor }} />
                  </div>
                  <span className="font-medium text-foreground">{category.nome}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas */}
        <div>
          <h2 className="text-lg font-display font-semibold text-expense mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-expense" />
            Categorias de Despesa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {expenseCategories.map((category) => (
              <div
                key={category.id}
                className="stat-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.cor}20` }}
                  >
                    <Tag className="h-5 w-5" style={{ color: category.cor }} />
                  </div>
                  <span className="font-medium text-foreground">{category.nome}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
