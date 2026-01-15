import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Tag, Loader2 } from 'lucide-react';
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
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (editingCategory) {
      const success = await updateCategory(editingCategory.id, formData);
      if (success) {
        toast.success('Categoria atualizada com sucesso!');
        handleOpenChange(false);
      }
    } else {
      const result = await addCategory(formData);
      if (result) {
        toast.success('Categoria criada com sucesso!');
        handleOpenChange(false);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (category: Category) => {
    const success = await deleteCategory(category.id);
    if (success) {
      toast.success('Categoria excluída com sucesso!');
    }
  };

  const incomeCategories = categories.filter(c => c.tipo === 'Receita');
  const expenseCategories = categories.filter(c => c.tipo === 'Despesa');

  if (loading) {
    return (
      <MainLayout title="Categorias" subtitle="Organize suas receitas e despesas por categoria">
        <div className="space-y-8 pb-20 lg:pb-0">
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingCategory ? 'Salvar Alterações' : 'Criar Categoria'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma categoria cadastrada</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando sua primeira categoria</p>
        </div>
      ) : (
        <div className="space-y-8 pb-20 lg:pb-0">
          {/* Receitas */}
          <div>
            <h2 className="text-lg font-display font-semibold text-income mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-income" />
              Categorias de Receita
            </h2>
            {incomeCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma categoria de receita</p>
            ) : (
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
            )}
          </div>

          {/* Despesas */}
          <div>
            <h2 className="text-lg font-display font-semibold text-expense mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-expense" />
              Categorias de Despesa
            </h2>
            {expenseCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma categoria de despesa</p>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
