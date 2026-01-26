import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, TransactionType } from "@/types/finance";
import { toast } from "sonner";
import { IconPicker, CategoryIcon } from "@/components/ui/icon-picker";

const categoryColors = [
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#64748b",
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, loading } =
    useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Despesa" as TransactionType,
    cor: "#3b82f6",
    icone: "Tag",
  });

  const resetForm = () => {
    setFormData({ nome: "", tipo: "Despesa", cor: "#3b82f6", icone: "Tag" });
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
      icone: category.icone || "Tag",
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingCategory) {
      const success = await updateCategory(editingCategory.id, formData);
      if (success) {
        toast.success("Categoria atualizada com sucesso!");
        handleOpenChange(false);
      }
    } else {
      const result = await addCategory(formData);
      if (result) {
        toast.success("Categoria criada com sucesso!");
        handleOpenChange(false);
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (category: Category) => {
    const success = await deleteCategory(category.id);
    if (success) {
      toast.success("Categoria excluída com sucesso!");
    }
  };

  const incomeCategories = categories.filter((c) => c.tipo === "Receita");
  const expenseCategories = categories.filter((c) => c.tipo === "Despesa");

  if (loading) {
    return (
      <MainLayout
        title="Categorias"
        subtitle="Organize suas receitas e despesas"
      >
        <div className="space-y-6 pb-20 lg:pb-0">
          <div>
            <Skeleton className="h-5 w-36 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Categorias" subtitle="Organize suas receitas e despesas">
      <div className="flex justify-end mb-5">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
              title="Nova Categoria"
            >
              <Plus className="h-6 w-6" />
            </Button>
            {/* <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button> */}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-medium">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Alimentação"
                    required
                  />
                </div>
                <div className="flex-2 space-y-2">
                  {/* <Label>Ícone</Label> */}
                  <IconPicker
                    value={formData.icone}
                    onChange={(icone) => setFormData({ ...formData, icone })}
                    color={formData.cor}
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
                <div className="grid grid-cols-9 gap-1.5">
                  {categoryColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all",
                        formData.cor === color &&
                          "ring-2 ring-offset-2 ring-primary",
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
                ) : editingCategory ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Categoria"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CategoryIcon
              iconName="Tag"
              className="h-7 w-7 text-muted-foreground"
            />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">
            Nenhuma categoria
          </h3>
          <p className="text-sm text-muted-foreground">
            Comece adicionando sua primeira categoria
          </p>
        </div>
      ) : (
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Receitas */}
          <div>
            <h2 className="text-sm font-medium text-income mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-income" />
              Receitas
            </h2>
            {incomeCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma categoria de receita
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="stat-card !p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.cor}15` }}
                      >
                        <CategoryIcon
                          iconName={category.icone || "Tag"}
                          className="h-4 w-4"
                          color={category.cor}
                        />
                      </div>
                      <span className="font-medium text-sm text-foreground">
                        {category.nome}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Despesas */}
          <div>
            <h2 className="text-sm font-medium text-expense mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-expense" />
              Despesas
            </h2>
            {expenseCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma categoria de despesa
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="stat-card !p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.cor}15` }}
                      >
                        <CategoryIcon
                          iconName={category.icone || "Tag"}
                          className="h-4 w-4"
                          color={category.cor}
                        />
                      </div>
                      <span className="font-medium text-sm text-foreground">
                        {category.nome}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
