import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard } from "@/types/finance";
import { toast } from "sonner";

interface DbCreditCard {
  id: string;
  user_id: string;
  descricao: string;
  data_vencimento: number;
  data_fechamento: number;
  limite: number;
  created_at: string;
  updated_at: string;
}

export function useCreditCards() {
  const { user } = useAuth();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreditCards = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("credit_cards")
      .select("*")
      .order("descricao");

    if (error) {
      console.error("Error fetching credit cards:", error);
      toast.error("Erro ao carregar cartões");
    } else {
      setCreditCards(
        ((data as DbCreditCard[]) || []).map((card) => ({
          id: card.id,
          descricao: card.descricao,
          data_vencimento: card.data_vencimento,
          data_fechamento: card.data_fechamento,
          limite: Number(card.limite),
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCreditCards();
  }, [fetchCreditCards]);

  const addCreditCard = useCallback(
    async (card: Omit<CreditCard, "id">) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("credit_cards")
        .insert({
          user_id: user.id,
          descricao: card.descricao,
          data_vencimento: card.data_vencimento,
          data_fechamento: card.data_fechamento,
          limite: card.limite,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding credit card:", error);
        toast.error("Erro ao criar cartão");
        return null;
      }

      const newCard: CreditCard = {
        id: data.id,
        descricao: data.descricao,
        data_vencimento: data.data_vencimento,
        data_fechamento: data.data_fechamento,
        limite: Number(data.limite),
      };

      setCreditCards((prev) => [...prev, newCard]);
      return newCard;
    },
    [user],
  );

  const updateCreditCard = useCallback(
    async (id: string, updates: Partial<CreditCard>) => {
      const { error } = await supabase
        .from("credit_cards")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Error updating credit card:", error);
        toast.error("Erro ao atualizar cartão");
        return false;
      }

      setCreditCards((prev) =>
        prev.map((card) => (card.id === id ? { ...card, ...updates } : card)),
      );
      return true;
    },
    [],
  );

  const deleteCreditCard = useCallback(async (id: string) => {
    /// Validar se tme transação antes de deletar
    const { data } = await supabase
      .from("transactions")
      .select("id")
      .eq("cartao_id", id);

    if (data.length > 0) {
      toast.error("Cartão com transações vinculadas não pode ser excluída");
      return false;
    }

    const { error } = await supabase.from("credit_cards").delete().eq("id", id);

    if (error) {
      console.error("Error deleting credit card:", error);
      toast.error("Erro ao excluir cartão");
      return false;
    }

    setCreditCards((prev) => prev.filter((card) => card.id !== id));
    return true;
  }, []);

  return {
    creditCards,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refetch: fetchCreditCards,
  };
}
