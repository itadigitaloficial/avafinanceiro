import { useQuery } from "@tanstack/react-query";

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
  return Array.isArray(data) ? data : [data];
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
    staleTime: 60000,
  });
}
