-- Adicionar campo de ícone nas categorias
ALTER TABLE public.categories ADD COLUMN icone VARCHAR(50) DEFAULT 'Tag';

-- Adicionar campos para despesa fixa e parcelamento nos lançamentos
ALTER TABLE public.transactions 
  ADD COLUMN fixa BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN parcelas INTEGER DEFAULT NULL,
  ADD COLUMN parcela_atual INTEGER DEFAULT NULL,
  ADD COLUMN transaction_parent_id UUID DEFAULT NULL;

-- Criar índice para transações parentes
CREATE INDEX idx_transactions_parent_id ON public.transactions(transaction_parent_id);
CREATE INDEX idx_transactions_fatura_data ON public.transactions(fatura_data);