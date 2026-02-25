-- ============================================================
-- SETUP COMPLETO DO SUPABASE - AVA FINANCEIRO
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. TABELA: empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  _id text PRIMARY KEY,
  razao_social text,
  cnpj text,
  email text,
  telefone text,
  whatsapp text,
  website text,
  logo text,
  slug text,
  usuario text,
  centro_de_custo text[],
  editado boolean DEFAULT false,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  created_date timestamptz DEFAULT now(),
  modified_date timestamptz DEFAULT now()
);

-- 2. TABELA: users
CREATE TABLE IF NOT EXISTS public.users (
  user_id text PRIMARY KEY,
  mail text NOT NULL,
  nome text,
  empresa_id text REFERENCES public.empresas(_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. TABELA: fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  _id text PRIMARY KEY,
  nome_razao_social text,
  nome_fantasia text,
  nome text,
  cnpj text,
  documento text,
  email text,
  telefone text,
  contato_nome text,
  contato_telefone text,
  endereco text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cep text,
  endereco_uf text,
  cidade text,
  pais text,
  empresa text,
  natureza_juridica text,
  capital_social text,
  cadastrado_por text,
  external_id text,
  created_date timestamptz DEFAULT now(),
  modified_date timestamptz DEFAULT now(),
  created_by text
);

-- 4. TABELA: beneficiarios
CREATE TABLE IF NOT EXISTS public.beneficiarios (
  _id text PRIMARY KEY,
  nome_razao_social text,
  nome_fantasia text,
  nome text,
  cnpj text,
  documento text,
  email text,
  telefone text,
  empresa text,
  banco text,
  agencia text,
  conta text,
  tipo_conta text,
  pix text,
  created_date timestamptz DEFAULT now(),
  modified_date timestamptz DEFAULT now()
);

-- 5. TABELA: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  _id text PRIMARY KEY,
  categoria text,
  created_date timestamptz DEFAULT now()
);

-- 6. TABELA: contas_pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  _id text PRIMARY KEY,
  uniq_id text,
  numero_documento text,
  fornecedor text,
  fornecedor_id text,
  beneficiario text,
  beneficiario_id text,
  categoria text,
  valor numeric,
  vencimento text,
  venciamento text,
  data_pagamento text,
  data_do_pagamento text,
  data_da_emissao text,
  status text,
  empresa text,
  empresa_id text,
  descricao text,
  arquivo text,
  observacao text,
  conta_bancaria text,
  forma_pagamento text,
  anexos_complementares text,
  comprovante text,
  doc text,
  notas text,
  valor_com_desconto numeric,
  valor_total_abastecimento numeric,
  ocorrencia text,
  created_date timestamptz DEFAULT now(),
  modified_date timestamptz DEFAULT now(),
  created_by text
);

-- 7. TABELA: stripe_keys
CREATE TABLE IF NOT EXISTS public.stripe_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  stripe_publishable_key text NOT NULL,
  stripe_secret_key text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_keys ENABLE ROW LEVEL SECURITY;

-- Policies permissivas (acesso via anon key + service role)
-- Como a autenticação é feita via n8n (não via Supabase Auth),
-- usamos policies abertas. Ajuste conforme sua necessidade.

CREATE POLICY "Full access to empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to beneficiarios" ON public.beneficiarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to contas_pagar" ON public.contas_pagar FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read stripe keys" ON public.stripe_keys FOR SELECT USING (true);
CREATE POLICY "Anyone can insert stripe keys" ON public.stripe_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stripe keys" ON public.stripe_keys FOR UPDATE USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_stripe_keys_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stripe_keys_updated_at
  BEFORE UPDATE ON public.stripe_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_keys_updated_at();
