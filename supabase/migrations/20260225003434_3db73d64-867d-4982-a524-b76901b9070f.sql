
-- Tabela de empresas
CREATE TABLE public.empresas (
  _id TEXT PRIMARY KEY,
  razao_social TEXT,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  website TEXT,
  logo TEXT,
  slug TEXT,
  usuario TEXT,
  centro_de_custo TEXT[],
  editado BOOLEAN DEFAULT false,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  modified_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

-- Tabela de usuários (sem senha)
CREATE TABLE public.users (
  user_id TEXT PRIMARY KEY,
  mail TEXT NOT NULL,
  nome TEXT,
  empresa_id TEXT REFERENCES public.empresas(_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  _id TEXT PRIMARY KEY,
  nome_razao_social TEXT,
  nome_fantasia TEXT,
  nome TEXT,
  cnpj TEXT,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  contato_nome TEXT,
  contato_telefone TEXT,
  endereco TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cep TEXT,
  endereco_uf TEXT,
  cidade TEXT,
  pais TEXT,
  empresa TEXT,
  natureza_juridica TEXT,
  capital_social TEXT,
  cadastrado_por TEXT,
  external_id TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  modified_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);

-- Tabela de beneficiários
CREATE TABLE public.beneficiarios (
  _id TEXT PRIMARY KEY,
  nome_razao_social TEXT,
  nome_fantasia TEXT,
  nome TEXT,
  cnpj TEXT,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT,
  pix TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  modified_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.beneficiarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to beneficiarios" ON public.beneficiarios FOR ALL USING (true) WITH CHECK (true);

-- Tabela de categorias
CREATE TABLE public.categorias (
  _id TEXT PRIMARY KEY,
  categoria TEXT,
  created_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

-- Tabela de contas a pagar
CREATE TABLE public.contas_pagar (
  _id TEXT PRIMARY KEY,
  uniq_id TEXT,
  numero_documento TEXT,
  fornecedor TEXT,
  fornecedor_id TEXT,
  beneficiario TEXT,
  beneficiario_id TEXT,
  categoria TEXT,
  valor NUMERIC,
  vencimento TEXT,
  venciamento TEXT,
  data_pagamento TEXT,
  data_do_pagamento TEXT,
  data_da_emissao TEXT,
  status TEXT,
  empresa TEXT,
  empresa_id TEXT,
  descricao TEXT,
  arquivo TEXT,
  observacao TEXT,
  conta_bancaria TEXT,
  forma_pagamento TEXT,
  anexos_complementares TEXT,
  comprovante TEXT,
  doc TEXT,
  notas TEXT,
  valor_com_desconto NUMERIC,
  valor_total_abastecimento NUMERIC,
  ocorrencia TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  modified_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to contas_pagar" ON public.contas_pagar FOR ALL USING (true) WITH CHECK (true);
