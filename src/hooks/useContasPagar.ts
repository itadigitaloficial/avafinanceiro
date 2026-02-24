import { useQuery } from "@tanstack/react-query";
import { ContaPagar } from "@/types/conta";
import { getCachedData, setCachedData } from "@/lib/queryCache";

const API_URL = "https://n8n.itadigital.com.br/webhook/conta-pagar";

async function fetchContas(): Promise<ContaPagar[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar contas a pagar");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("contas-pagar", result);
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
