export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      beneficiarios: {
        Row: {
          _id: string
          agencia: string | null
          banco: string | null
          cnpj: string | null
          conta: string | null
          created_date: string | null
          documento: string | null
          email: string | null
          empresa: string | null
          modified_date: string | null
          nome: string | null
          nome_fantasia: string | null
          nome_razao_social: string | null
          pix: string | null
          telefone: string | null
          tipo_conta: string | null
        }
        Insert: {
          _id: string
          agencia?: string | null
          banco?: string | null
          cnpj?: string | null
          conta?: string | null
          created_date?: string | null
          documento?: string | null
          email?: string | null
          empresa?: string | null
          modified_date?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string | null
          pix?: string | null
          telefone?: string | null
          tipo_conta?: string | null
        }
        Update: {
          _id?: string
          agencia?: string | null
          banco?: string | null
          cnpj?: string | null
          conta?: string | null
          created_date?: string | null
          documento?: string | null
          email?: string | null
          empresa?: string | null
          modified_date?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string | null
          pix?: string | null
          telefone?: string | null
          tipo_conta?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          _id: string
          categoria: string | null
          created_date: string | null
        }
        Insert: {
          _id: string
          categoria?: string | null
          created_date?: string | null
        }
        Update: {
          _id?: string
          categoria?: string | null
          created_date?: string | null
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          _id: string
          anexos_complementares: string | null
          arquivo: string | null
          beneficiario: string | null
          beneficiario_id: string | null
          categoria: string | null
          comprovante: string | null
          conta_bancaria: string | null
          created_by: string | null
          created_date: string | null
          data_da_emissao: string | null
          data_do_pagamento: string | null
          data_pagamento: string | null
          descricao: string | null
          doc: string | null
          empresa: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor: string | null
          fornecedor_id: string | null
          modified_date: string | null
          notas: string | null
          numero_documento: string | null
          observacao: string | null
          ocorrencia: string | null
          status: string | null
          uniq_id: string | null
          valor: number | null
          valor_com_desconto: number | null
          valor_total_abastecimento: number | null
          venciamento: string | null
          vencimento: string | null
        }
        Insert: {
          _id: string
          anexos_complementares?: string | null
          arquivo?: string | null
          beneficiario?: string | null
          beneficiario_id?: string | null
          categoria?: string | null
          comprovante?: string | null
          conta_bancaria?: string | null
          created_by?: string | null
          created_date?: string | null
          data_da_emissao?: string | null
          data_do_pagamento?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          doc?: string | null
          empresa?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          modified_date?: string | null
          notas?: string | null
          numero_documento?: string | null
          observacao?: string | null
          ocorrencia?: string | null
          status?: string | null
          uniq_id?: string | null
          valor?: number | null
          valor_com_desconto?: number | null
          valor_total_abastecimento?: number | null
          venciamento?: string | null
          vencimento?: string | null
        }
        Update: {
          _id?: string
          anexos_complementares?: string | null
          arquivo?: string | null
          beneficiario?: string | null
          beneficiario_id?: string | null
          categoria?: string | null
          comprovante?: string | null
          conta_bancaria?: string | null
          created_by?: string | null
          created_date?: string | null
          data_da_emissao?: string | null
          data_do_pagamento?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          doc?: string | null
          empresa?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          modified_date?: string | null
          notas?: string | null
          numero_documento?: string | null
          observacao?: string | null
          ocorrencia?: string | null
          status?: string | null
          uniq_id?: string | null
          valor?: number | null
          valor_com_desconto?: number | null
          valor_total_abastecimento?: number | null
          venciamento?: string | null
          vencimento?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          _id: string
          centro_de_custo: string[] | null
          cnpj: string | null
          created_date: string | null
          editado: boolean | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          endereco_uf: string | null
          logo: string | null
          modified_date: string | null
          razao_social: string | null
          slug: string | null
          telefone: string | null
          usuario: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          _id: string
          centro_de_custo?: string[] | null
          cnpj?: string | null
          created_date?: string | null
          editado?: boolean | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          endereco_uf?: string | null
          logo?: string | null
          modified_date?: string | null
          razao_social?: string | null
          slug?: string | null
          telefone?: string | null
          usuario?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          _id?: string
          centro_de_custo?: string[] | null
          cnpj?: string | null
          created_date?: string | null
          editado?: boolean | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          endereco_uf?: string | null
          logo?: string | null
          modified_date?: string | null
          razao_social?: string | null
          slug?: string | null
          telefone?: string | null
          usuario?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          _id: string
          cadastrado_por: string | null
          capital_social: string | null
          cidade: string | null
          cnpj: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_by: string | null
          created_date: string | null
          documento: string | null
          email: string | null
          empresa: string | null
          endereco: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_complemento: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          external_id: string | null
          modified_date: string | null
          natureza_juridica: string | null
          nome: string | null
          nome_fantasia: string | null
          nome_razao_social: string | null
          pais: string | null
          telefone: string | null
        }
        Insert: {
          _id: string
          cadastrado_por?: string | null
          capital_social?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_by?: string | null
          created_date?: string | null
          documento?: string | null
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_complemento?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          external_id?: string | null
          modified_date?: string | null
          natureza_juridica?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string | null
          pais?: string | null
          telefone?: string | null
        }
        Update: {
          _id?: string
          cadastrado_por?: string | null
          capital_social?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_by?: string | null
          created_date?: string | null
          documento?: string | null
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_complemento?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          external_id?: string | null
          modified_date?: string | null
          natureza_juridica?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          nome_razao_social?: string | null
          pais?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      stripe_keys: {
        Row: {
          created_at: string
          created_by: string
          empresa_id: string
          id: string
          stripe_publishable_key: string
          stripe_secret_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          empresa_id: string
          id?: string
          stripe_publishable_key: string
          stripe_secret_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          empresa_id?: string
          id?: string
          stripe_publishable_key?: string
          stripe_secret_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          mail: string
          nome: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          mail: string
          nome?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          mail?: string
          nome?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
