import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fornecedor } from "@/types/conta";
import { supabase } from "@/integrations/supabase/client";
import { syncToSupabase, mapFornecedor } from "@/lib/supabaseSync";
import { useEffect } from "react";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-fornecedor";

async function fetchFromSupabase(): Promise<Fornecedor[]> {
  const { data, error } = await supabase.from("fornecedores").select("*");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...row,
    ID: row.external_id,
    "Created Date": row.created_date,
    "Modified Date": row.modified_date,
    "Created By": row.created_by,
  }));
}

async function syncFromN8n(): Promise<void> {
  const res = await fetch(API_URL);
  if (!res.ok) return;
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  const mapped = result.filter((f: any) => f._id).map((f: any) => mapFornecedor(f));
  if (mapped.length > 0) await syncToSupabase("fornecedores", mapped);
}

export function useFornecedores() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fornecedores"],
    queryFn: fetchFromSupabase,
    staleTime: 60000,
    gcTime: 600000,
  });

  useEffect(() => {
    syncFromN8n()
      .then(() => queryClient.invalidateQueries({ queryKey: ["fornecedores"] }))
      .catch((err) => console.warn("[Sync] n8n fornecedores sync failed:", err));
  }, []);

  return query;
}
