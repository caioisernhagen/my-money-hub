import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditCards } from "@/hooks/useCreditCards";
import {
  Transaction,
  TransactionType,
  TransactionFilters,
  CreditCard,
} from "@/types/finance";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";
import { calcularMesFatura } from "@/lib/creditCardHelpers";

interface DbTransaction {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  conta_id: string;
  categoria_id: string;
  pago: boolean;
  cartao: boolean;
  cartao_id: string | null;
  fatura_mes: string | null;
  fixa: boolean;
  parcelas: number | null;
  parcela_atual: number | null;
  transaction_parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const { creditCards } = useCreditCards();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("data,categoria_id", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar lançamentos");
    } else {
      setTransactions(
        ((data as DbTransaction[]) || []).map((t) => ({
          id: t.id,
          descricao: t.descricao,
          valor: Number(t.valor),
          data: t.data,
          tipo: t.tipo as TransactionType,
          conta_id: t.conta_id,
          categoria_id: t.categoria_id,
          pago: t.pago,
          cartao: t.cartao,
          cartao_id: t.cartao_id,
          fatura_mes: t.fatura_mes,
          fixa: t.fixa,
          parcelas: t.parcelas,
          parcela_atual: t.parcela_atual,
          transaction_parent_id: t.transaction_parent_id,
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id">) => {
      if (!user) return null;

      // Helper para calcular fatura_mes
      const calcularFaturaMes = (
        data: string,
        ehCartao: boolean,
        cartaoId?: string | null,
      ): string | null => {
        if (!ehCartao || !cartaoId) return null;
        const cartao = creditCards.find((c) => c.id === cartaoId);
        if (!cartao) return null;
        return calcularMesFatura(data, cartao.data_fechamento);
      };

      // Se for parcelado, criar várias transações
      if (
        (transaction.cartao &&
          transaction.parcelas &&
          transaction.parcelas > 1) ||
        transaction.fixa
      ) {
        const valorParcela = transaction.fixa
          ? transaction.valor
          : transaction.valor / transaction.parcelas;
        const parcelas = transaction.fixa ? 36 : transaction.parcelas;
        const transactionsToCreate = [];

        for (let i = 0; i < parcelas; i++) {
          const data = transaction.data
            ? format(
                addMonths(new Date(transaction.data + "T12:00:00"), i),
                "yyyy-MM-dd",
              )
            : null;

          const descricao = transaction.fixa
            ? transaction.descricao
            : `${transaction.descricao} (${i + 1}/${transaction.parcelas})`;

          const faturaMes = calcularFaturaMes(
            data || "",
            transaction.cartao,
            transaction.cartao_id,
          );

          transactionsToCreate.push({
            user_id: user.id,
            descricao: descricao,
            valor: valorParcela,
            data: data,
            tipo: transaction.tipo,
            conta_id: transaction.conta_id,
            categoria_id: transaction.categoria_id,
            pago: transaction.pago,
            cartao: transaction.cartao,
            cartao_id: transaction.cartao_id || null,
            fatura_mes: faturaMes,
            fixa: false,
            parcelas: transaction.parcelas,
            parcela_atual: i + 1,
            transaction_parent_id: null,
          });
        }

        const { data, error } = await supabase
          .from("transactions")
          .insert(transactionsToCreate)
          .select();

        if (error) {
          console.error("Error adding transactions:", error);
          toast.error("Erro ao criar lançamentos parcelados");
          return null;
        }

        const newTransactions = (data as DbTransaction[]).map((t) => ({
          id: t.id,
          descricao: t.descricao,
          valor: Number(t.valor),
          data: t.data,
          tipo: t.tipo as TransactionType,
          conta_id: t.conta_id,
          categoria_id: t.categoria_id,
          pago: t.pago,
          cartao: t.cartao,
          cartao_id: t.cartao_id,
          fatura_mes: t.fatura_mes,
          fixa: t.fixa,
          parcelas: t.parcelas,
          parcela_atual: t.parcela_atual,
          transaction_parent_id: t.transaction_parent_id,
        }));

        setTransactions((prev) => [...newTransactions, ...prev]);
        toast.success(`${transaction.parcelas} parcelas criadas com sucesso!`);
        return newTransactions[0];
      }

      // Transação normal
      const faturaMes = calcularFaturaMes(
        transaction.data || "",
        transaction.cartao,
        transaction.cartao_id,
      );

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          descricao: transaction.descricao,
          valor: transaction.valor,
          data: transaction.data,
          tipo: transaction.tipo,
          conta_id: transaction.conta_id,
          categoria_id: transaction.categoria_id,
          pago: transaction.pago,
          cartao: transaction.cartao,
          cartao_id: transaction.cartao_id || null,
          fatura_mes: faturaMes || transaction.fatura_mes || null,
          fixa: transaction.fixa || false,
          parcelas: null,
          parcela_atual: null,
          transaction_parent_id: null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding transaction:", error);
        toast.error("Erro ao criar lançamento");
        return null;
      }

      const newTransaction: Transaction = {
        id: data.id,
        descricao: data.descricao,
        valor: Number(data.valor),
        data: data.data,
        tipo: data.tipo as TransactionType,
        conta_id: data.conta_id,
        categoria_id: data.categoria_id,
        pago: data.pago,
        cartao: data.cartao,
        cartao_id: data.cartao_id,
        fatura_mes: data.fatura_mes,
        fixa: data.fixa,
        parcelas: data.parcelas,
        parcela_atual: data.parcela_atual,
        transaction_parent_id: data.transaction_parent_id,
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      return newTransaction;
    },
    [user],
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>, action: string) => {
      let idsToUpdate = [id];
      const { data: findRow } = await supabase
        .from("transactions")
        .select()
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Error updating transaction:", error);
        toast.error("Erro ao atualizar lançamento");
        return false;
      } else if (action !== "salvar") {
        let query = supabase
          .from("transactions")
          .select()
          .eq("conta_id", findRow.conta_id)
          .eq("descricao", findRow.descricao)
          .eq("tipo", findRow.tipo);

        query =
          action === "salvar-futuras"
            ? query.gt("data", findRow.data)
            : query.eq("pago", false);
        const { data: dados } = await query;
        idsToUpdate = [id, ...(dados?.map((t) => t.id) || [])];

        delete updates.data;

        const { error } = await supabase
          .from("transactions")
          .update(updates)
          .in("id", idsToUpdate);

        if (error) {
          console.error("Error updating transaction:", error);
          toast.error("Erro ao atualizar lançamento");
          return false;
        }
      }

      setTransactions((prev) =>
        prev.map((t) =>
          idsToUpdate.includes(t.id) ? { ...t, ...updates } : t,
        ),
      );
      return true;
    },
    [],
  );

  const deleteTransaction = useCallback(async (id: string, action: string) => {
    const { data: findRow } = await supabase
      .from("transactions")
      .select()
      .eq("id", id)
      .single();

    if (!findRow) return false;

    let idsToDelete = [id];

    if (action !== "deletar") {
      let query = supabase
        .from("transactions")
        .select()
        .eq("conta_id", findRow.conta_id)
        .eq("descricao", findRow.descricao)
        .eq("tipo", findRow.tipo);

      query =
        action === "deletar-futuras"
          ? query.gt("data", findRow.data)
          : query.eq("pago", false);

      const { data: dados } = await query;
      idsToDelete = [id, ...(dados?.map((t) => t.id) || [])];
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erro ao excluir lançamento");
      return false;
    }

    setTransactions((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
    return true;
  }, []);

  const togglePago = useCallback(
    async (id: string) => {
      const transaction = transactions.find((t) => t.id === id);
      if (!transaction) return;

      await updateTransaction(id, { pago: !transaction.pago }, "salvar");
    },
    [transactions, updateTransaction],
  );

  const toggleCartao = useCallback(
    async (id: string) => {
      const transaction = transactions.find((t) => t.id === id);
      if (!transaction) return;

      await updateTransaction(id, { cartao: !transaction.cartao }, "salvar");
    },
    [transactions, updateTransaction],
  );

  const filterTransactions = useCallback(
    (filters: TransactionFilters): Transaction[] => {
      return transactions.filter((t) => {
        const date =
          t.cartao && t.fatura_mes
            ? format(new Date(t.fatura_mes + "-01T12:00:00"), "yyyy-MM-dd")
            : t.data;
        if (filters.dataInicio && date < filters.dataInicio) return false;
        if (filters.dataFim && date > filters.dataFim) return false;
        if (filters.conta_id && t.conta_id !== filters.conta_id) return false;
        if (filters.categoria_id && t.categoria_id !== filters.categoria_id)
          return false;
        if (filters.tipo && t.tipo !== filters.tipo) return false;
        if (filters.pago !== undefined && t.pago !== filters.pago) return false;
        if (
          filters.cartao_id !== undefined &&
          filters.cartao_id !== "noCard" &&
          t.cartao_id !== filters.cartao_id
        )
          return false;
        if (filters.cartao_id === "noCard" && t.cartao_id !== null)
          return false;

        return true;
      });
    },
    [transactions],
  );

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePago,
    toggleCartao,
    filterTransactions,
    refetch: fetchTransactions,
  };
}
