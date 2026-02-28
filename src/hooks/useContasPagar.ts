import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ContaPagar } from "@/types/conta";
import { supabase } from "@/integrations/supabase/client";
import { syncToSupabase, mapContaPagar } from "@/lib/supabaseSync";
import { useEffect } from "react";

const API_URL = "https://n8n.itadigital.com.br/webhook/conta-pagar";

async function fetchFromSupabase(): Promise<ContaPagar[]> {
  const { data, error } = await supabase.from("contas_pagar").select("*");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...row,
    id: row._id,
    "Created Date": row.created_date,
    "Modified Date": row.modified_date,
    "Created By": row.created_by,
  }));
}

async function syncFromN8n(): Promise<ContaPagar[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar contas a pagar");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  const mapped = result.filter((c: any) => c._id || c.id).map((c: any) => mapContaPagar(c));
  if (mapped.length > 0) await syncToSupabase("contas_pagar", mapped);
  return result;
}

export function useContasPagar() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contas-pagar"],
    queryFn: fetchFromSupabase,
    staleTime: 60000,
    gcTime: 600000,
  });

  // Background sync from n8n, then refresh Supabase data
  useEffect(() => {
    syncFromN8n()
      .then(() => queryClient.invalidateQueries({ queryKey: ["contas-pagar"] }))
      .catch((err) => console.warn("[Sync] n8n sync failed:", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}
