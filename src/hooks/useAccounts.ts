import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Account, AccountType } from "@/types/finance";
import { toast } from "sonner";

interface DbAccount {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("nome");

    if (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Erro ao carregar contas");
    } else {
      setAccounts(
        ((data as DbAccount[]) || []).map((acc) => ({
          id: acc.id,
          nome: acc.nome,
          tipo: acc.tipo as AccountType,
          saldo_inicial: Number(acc.saldo_inicial),
          ativo: acc.ativo,
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(
    async (account: Omit<Account, "id">) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          nome: account.nome,
          tipo: account.tipo,
          saldo_inicial: account.saldo_inicial,
          ativo: account.ativo,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding account:", error);
        if (error.code === "23505") {
          toast.error("Já existe uma conta com esse nome");
        } else {
          toast.error("Erro ao criar conta");
        }
        return null;
      }

      const newAccount: Account = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo as AccountType,
        saldo_inicial: Number(data.saldo_inicial),
        ativo: data.ativo,
      };

      setAccounts((prev) => [...prev, newAccount]);
      return newAccount;
    },
    [user],
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      const { error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Error updating account:", error);
        if (error.code === "23505") {
          toast.error("Já existe uma conta com esse nome");
        } else {
          toast.error("Erro ao atualizar conta");
        }
        return false;
      }

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
      );
      return true;
    },
    [],
  );

  const deleteAccount = useCallback(async (id: string) => {
    // Validar se tme transação antes de deletar
    const { data } = await supabase
      .from("transactions")
      .select("id")
      .eq("conta_id", id);

    console.log("data", data);
    if (data.length > 0) {
      toast.error("Conta com transações vinculadas não pode ser excluída");
      return false;
    }

    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting account:", error);
      toast.error("Erro ao excluir conta");
      return false;
    }

    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    return true;
  }, []);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: fetchAccounts,
  };
}
