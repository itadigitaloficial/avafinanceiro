import { useQuery } from "@tanstack/react-query";
import { ContaPagar } from "@/types/conta";

const API_URL = "https://n8n.itadigital.com.br/webhook/conta-pagar";

async function fetchContas(): Promise<ContaPagar[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar contas a pagar");
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export function useContasPagar() {
  return useQuery({
    queryKey: ["contas-pagar"],
    queryFn: fetchContas,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
