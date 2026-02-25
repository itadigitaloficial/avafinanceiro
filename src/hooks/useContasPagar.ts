import { useQuery } from "@tanstack/react-query";
import { ContaPagar } from "@/types/conta";
import { getCachedData, setCachedData } from "@/lib/queryCache";
import { syncToSupabase, mapContaPagar } from "@/lib/supabaseSync";

const API_URL = "https://n8n.itadigital.com.br/webhook/conta-pagar";

async function fetchContas(): Promise<ContaPagar[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar contas a pagar");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("contas-pagar", result);
  // Sync to Supabase in background
  const mapped = result.filter((c: any) => c._id || c.id).map((c: any) => mapContaPagar(c));
  if (mapped.length > 0) syncToSupabase("contas_pagar", mapped);
  return result;
}

export function useContasPagar() {
  return useQuery({
    queryKey: ["contas-pagar"],
    queryFn: fetchContas,
    initialData: getCachedData<ContaPagar[]>("contas-pagar"),
    refetchInterval: 120000,
    staleTime: 300000,
    gcTime: 600000,
  });
}
