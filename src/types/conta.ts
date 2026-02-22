export interface ContaPagar {
  id?: string;
  uniq_id?: string;
  numero_documento?: string;
  fornecedor?: string;
  fornecedor_id?: string;
  categoria?: string;
  valor?: number;
  vencimento?: string;
  data_pagamento?: string;
  status?: string;
  empresa?: string;
  empresa_id?: string;
  descricao?: string;
  arquivo?: string;
  observacao?: string;
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
