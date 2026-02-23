export interface ContaPagar {
  _id?: string;
  id?: string;
  uniq_id?: string;
  numero_documento?: string;
  fornecedor?: string;
  fornecedor_id?: string;
  beneficiario?: string;
  beneficiario_id?: string;
  categoria?: string;
  valor?: number;
  vencimento?: string;
  venciamento?: string;
  data_pagamento?: string;
  data_do_pagamento?: string;
  data_da_emissao?: string;
  status?: string;
  empresa?: string;
  empresa_id?: string;
  descricao?: string;
  arquivo?: string;
  observacao?: string;
  conta_bancaria?: string;
  forma_pagamento?: string;
  "Created Date"?: string;
  "Modified Date"?: string;
  "Created By"?: string;
}

export interface AuthUser {
  user_id: string;
  mail: string;
  nome: string;
  token: string;
  expires: number;
}

export interface Empresa {
  _id: string;
  Razao_social?: string;
  cnpj?: string;
  Email?: string;
  Telefone?: string;
  Whatsapp?: string;
  Website?: string;
  Logo?: string;
  Slug?: string;
  Usuario?: string;
  centro_de_custo?: string[];
  Editado?: boolean;
  "Endereco rua"?: string;
  "Endereco numero"?: string;
  "Endereco bairro"?: string;
  "Endereco cidade"?: string;
  "Endereco uf"?: string;
  "Endereco cep"?: string;
  "Created Date"?: string;
  "Modified Date"?: string;
}

export interface Fornecedor {
  _id: string;
  nome_razao_social?: string;
  nome_fantasia?: string;
  nome?: string;
  cnpj?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  contato_nome?: string;
  contato_telefone?: string;
  endereco?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  endereco_uf?: string;
  cidade?: string;
  pais?: string;
  empresa?: string;
  natureza_juridica?: string;
  capital_social?: string;
  cadastrado_por?: string;
  ID?: string;
  "Created Date"?: string;
  "Modified Date"?: string;
  "Created By"?: string;
}

export interface Beneficiario {
  _id: string;
  nome_razao_social?: string;
  nome_fantasia?: string;
  nome?: string;
  cnpj?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  pix?: string;
  "Created Date"?: string;
  "Modified Date"?: string;
}
