import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { syncToSupabase } from "@/lib/supabaseSync";
import { useEffect } from "react";

export interface Categoria {
  _id: string;
  categoria?: string;
  [key: string]: unknown;
}

const API_URL = "https://n8n.itadigital.com.br/webhook/financeiro-contas-pagar-categoria";

async function fetchFromSupabase(): Promise<Categoria[]> {
  const { data, error } = await supabase.from("categorias").select("*");
  if (error) throw error;
  return (data || []) as Categoria[];
}

async function syncFromN8n(): Promise<void> {
  const res = await fetch(API_URL);
  if (!res.ok) return;
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  const mapped = result
    .filter((c: any) => c._id)
    .map((c: any) => ({ _id: c._id, categoria: c.categoria || null }));
  if (mapped.length > 0) await syncToSupabase("categorias", mapped);
}

export function useCategorias() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categorias"],
    queryFn: fetchFromSupabase,
    staleTime: 60000,
    gcTime: 600000,
  });

  useEffect(() => {
    syncFromN8n()
      .then(() => queryClient.invalidateQueries({ queryKey: ["categorias"] }))
      .catch((err) => console.warn("[Sync] n8n categorias sync failed:", err));
  }, []);

  return query;
}
