-- Adiciona campo de limite/fatura atual ao cartão de crédito
ALTER TABLE public.credit_cards 
ADD COLUMN limite numeric NOT NULL DEFAULT 0;

-- Adiciona campo para data da fatura (mês/ano) nas transações de cartão
ALTER TABLE public.transactions
ADD COLUMN fatura_mes date;