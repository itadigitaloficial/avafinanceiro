import { useQuery } from "@tanstack/react-query";
import { getCachedData, setCachedData } from "@/lib/queryCache";

export interface Categoria {
  _id: string;
  categoria?: string;
  [key: string]: unknown;
}

const API_URL = "https://n8n.itadigital.com.br/webhook/financeiro-contas-pagar-categoria";

async function fetchCategorias(): Promise<Categoria[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar categorias");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("categorias", result);
  return result;
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
    initialData: getCachedData<Categoria[]>("categorias"),
    staleTime: 300000,
    gcTime: 600000,
  });
}
