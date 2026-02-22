import { useQuery } from "@tanstack/react-query";
import { Fornecedor } from "@/types/conta";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-fornecedor";

async function fetchFornecedores(): Promise<Fornecedor[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar fornecedores");
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export function useFornecedores() {
  return useQuery({
    queryKey: ["fornecedores"],
    queryFn: fetchFornecedores,
    staleTime: 60000,
  });
}
