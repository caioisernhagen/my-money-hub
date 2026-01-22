import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Category, TransactionType } from "@/types/finance";
import { toast } from "sonner";

interface DbCategory {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string | null;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("nome");

    if (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erro ao carregar categorias");
    } else {
      setCategories(
        ((data as DbCategory[]) || []).map((cat) => ({
          id: cat.id,
          nome: cat.nome,
          tipo: cat.tipo as TransactionType,
          cor: cat.cor,
          icone: cat.icone || "Tag",
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(
    async (category: Omit<Category, "id">) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          nome: category.nome,
          tipo: category.tipo,
          cor: category.cor,
          icone: category.icone || "Tag",
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding category:", error);
        if (error.code === "23505") {
          toast.error("Já existe uma categoria com esse nome");
        } else {
          toast.error("Erro ao criar categoria");
        }
        return null;
      }

      const newCategory: Category = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo as TransactionType,
        cor: data.cor,
        icone: data.icone || "Tag",
      };

      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    },
    [user],
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      const { error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Error updating category:", error);
        if (error.code === "23505") {
          toast.error("Já existe uma categoria com esse nome");
        } else {
          toast.error("Erro ao atualizar categoria");
        }
        return false;
      }

      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
      );
      return true;
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string) => {
    // Validar se tme transação antes de deletar
    const { data } = await supabase
      .from("transactions")
      .select("id")
      .eq("categoria_id", id);

    console.log("data", data);
    if (data.length > 0) {
      toast.error("Categoria com transações vinculadas não pode ser excluída");
      return false;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      toast.error("Erro ao excluir categoria");
      return false;
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    return true;
  }, []);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
