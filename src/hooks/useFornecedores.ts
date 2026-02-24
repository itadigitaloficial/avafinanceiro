import { useQuery } from "@tanstack/react-query";
import { Fornecedor } from "@/types/conta";
import { getCachedData, setCachedData } from "@/lib/queryCache";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-fornecedor";

async function fetchFornecedores(): Promise<Fornecedor[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar fornecedores");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("fornecedores", result);
  return result;
}

export function useFornecedores() {
  return useQuery({
    queryKey: ["fornecedores"],
    queryFn: fetchFornecedores,
    initialData: getCachedData<Fornecedor[]>("fornecedores"),
    staleTime: 300000,
    gcTime: 600000,
  });
}
