import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Beneficiario } from "@/types/conta";
import { supabase } from "@/integrations/supabase/client";
import { syncToSupabase, mapBeneficiario } from "@/lib/supabaseSync";
import { useEffect } from "react";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-beneficiario";

async function fetchFromSupabase(): Promise<Beneficiario[]> {
  const { data, error } = await supabase.from("beneficiarios").select("*");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...row,
    "Created Date": row.created_date,
    "Modified Date": row.modified_date,
  }));
}

async function syncFromN8n(): Promise<void> {
  const res = await fetch(API_URL);
  if (!res.ok) return;
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  const mapped = result.filter((b: any) => b._id).map((b: any) => mapBeneficiario(b));
  if (mapped.length > 0) await syncToSupabase("beneficiarios", mapped);
}

export function useBeneficiarios() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["beneficiarios"],
    queryFn: fetchFromSupabase,
    staleTime: 60000,
    gcTime: 600000,
  });

  useEffect(() => {
    syncFromN8n()
      .then(() => queryClient.invalidateQueries({ queryKey: ["beneficiarios"] }))
      .catch((err) => console.warn("[Sync] n8n beneficiarios sync failed:", err));
  }, []);

  return query;
}
