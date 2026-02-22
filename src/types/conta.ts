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
  descricao?: string;
  arquivo?: string;
  observacao?: string;
}
