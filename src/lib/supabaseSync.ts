import { supabase } from "@/integrations/supabase/client";

/**
 * Generic upsert function for syncing n8n data to Supabase.
 * Runs silently in background — never blocks the UI.
 */
export async function syncToSupabase<T extends Record<string, unknown>>(
  table: string,
  data: T[],
  primaryKey: string = "_id"
): Promise<void> {
  if (!data || data.length === 0) return;

  try {
    // Process in batches of 100 to avoid payload limits
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error } = await (supabase as any)
        .from(table)
        .upsert(batch, { onConflict: primaryKey, ignoreDuplicates: false });

      if (error) {
        console.warn(`[Sync] Erro ao sincronizar ${table}:`, error.message);
      }
    }
  } catch (err) {
    console.warn(`[Sync] Falha silenciosa ao sincronizar ${table}:`, err);
  }
}

/**
 * Sync user data to Supabase after login
 */
export async function syncUser(userData: {
  user_id: string;
  mail: string;
  nome: string;
  empresa_id?: string;
}): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from("users")
      .upsert(
        {
          user_id: userData.user_id,
          mail: userData.mail,
          nome: userData.nome,
          empresa_id: userData.empresa_id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.warn("[Sync] Erro ao sincronizar usuário:", error.message);
    }
  } catch (err) {
    console.warn("[Sync] Falha silenciosa ao sincronizar usuário:", err);
  }
}

/**
 * Sync empresa data to Supabase
 */
export async function syncEmpresa(empresa: Record<string, unknown>): Promise<void> {
  if (!empresa || !empresa._id) return;

  try {
    const mapped = {
      _id: empresa._id,
      razao_social: empresa.Razao_social || null,
      cnpj: empresa.cnpj || null,
      email: empresa.Email || null,
      telefone: empresa.Telefone || null,
      whatsapp: empresa.Whatsapp || null,
      website: empresa.Website || null,
      logo: empresa.Logo || null,
      slug: empresa.Slug || null,
      usuario: empresa.Usuario || null,
      centro_de_custo: empresa.centro_de_custo || null,
      editado: empresa.Editado || false,
      endereco_rua: empresa["Endereco rua"] || null,
      endereco_numero: empresa["Endereco numero"] || null,
      endereco_bairro: empresa["Endereco bairro"] || null,
      endereco_cidade: empresa["Endereco cidade"] || null,
      endereco_uf: empresa["Endereco uf"] || null,
      endereco_cep: empresa["Endereco cep"] || null,
      modified_date: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from("empresas")
      .upsert(mapped, { onConflict: "_id" });

    if (error) {
      console.warn("[Sync] Erro ao sincronizar empresa:", error.message);
    }
  } catch (err) {
    console.warn("[Sync] Falha silenciosa ao sincronizar empresa:", err);
  }
}

/**
 * Map fornecedor from n8n format to Supabase format
 */
export function mapFornecedor(f: Record<string, unknown>) {
  return {
    _id: f._id,
    nome_razao_social: f.nome_razao_social || null,
    nome_fantasia: f.nome_fantasia || null,
    nome: f.nome || null,
    cnpj: f.cnpj || null,
    documento: f.documento || null,
    email: f.email || null,
    telefone: f.telefone || null,
    contato_nome: f.contato_nome || null,
    contato_telefone: f.contato_telefone || null,
    endereco: f.endereco || null,
    endereco_numero: f.endereco_numero || null,
    endereco_complemento: f.endereco_complemento || null,
    endereco_bairro: f.endereco_bairro || null,
    endereco_cep: f.endereco_cep || null,
    endereco_uf: f.endereco_uf || null,
    cidade: f.cidade || null,
    pais: f.pais || null,
    empresa: f.empresa || null,
    natureza_juridica: f.natureza_juridica || null,
    capital_social: f.capital_social || null,
    cadastrado_por: f.cadastrado_por || null,
    external_id: f.ID || null,
    created_by: f["Created By"] || null,
  };
}

/**
 * Map beneficiario from n8n format to Supabase format
 */
export function mapBeneficiario(b: Record<string, unknown>) {
  return {
    _id: b._id,
    nome_razao_social: b.nome_razao_social || null,
    nome_fantasia: b.nome_fantasia || null,
    nome: b.nome || null,
    cnpj: b.cnpj || null,
    documento: b.documento || null,
    email: b.email || null,
    telefone: b.telefone || null,
    empresa: b.empresa || null,
    banco: b.banco || null,
    agencia: b.agencia || null,
    conta: b.conta || null,
    tipo_conta: b.tipo_conta || null,
    pix: b.pix || null,
  };
}

/**
 * Map conta a pagar from n8n format to Supabase format
 */
export function mapContaPagar(c: Record<string, unknown>) {
  return {
    _id: c._id || c.id,
    uniq_id: c.uniq_id || null,
    numero_documento: c.numero_documento || null,
    fornecedor: c.fornecedor || null,
    fornecedor_id: c.fornecedor_id || null,
    beneficiario: c.beneficiario || null,
    beneficiario_id: c.beneficiario_id || null,
    categoria: c.categoria || null,
    valor: c.valor || null,
    vencimento: c.vencimento || null,
    venciamento: c.venciamento || null,
    data_pagamento: c.data_pagamento || null,
    data_do_pagamento: c.data_do_pagamento || null,
    data_da_emissao: c.data_da_emissao || null,
    status: c.status || null,
    empresa: c.empresa || null,
    empresa_id: c.empresa_id || null,
    descricao: c.descricao || null,
    arquivo: c.arquivo || null,
    observacao: c.observacao || null,
    conta_bancaria: c.conta_bancaria || null,
    forma_pagamento: c.forma_pagamento || null,
    anexos_complementares: c.anexos_complementares || null,
    comprovante: c.comprovante || null,
    doc: c.doc || null,
    notas: c.notas || null,
    valor_com_desconto: c.valor_com_desconto || null,
    valor_total_abastecimento: c.valor_total_abastecimento || null,
    ocorrencia: c.ocorrencia || null,
    created_by: c["Created By"] || null,
  };
}
