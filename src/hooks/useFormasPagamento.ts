import { useQuery } from "@tanstack/react-query";
import { getCachedData, setCachedData } from "@/lib/queryCache";

export interface FormaPagamento {
  _id: string;
  nome?: string;
  forma_pagamento?: string;
  descricao?: string;
  empresa?: string;
  [key: string]: any;
}

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-forma-pagamento";

async function fetchFormasPagamento(): Promise<FormaPagamento[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar formas de pagamento");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("formas-pagamento", result);
  return result;
}

export function useFormasPagamento() {
  return useQuery({
    queryKey: ["formas-pagamento"],
    queryFn: fetchFormasPagamento,
    initialData: getCachedData<FormaPagamento[]>("formas-pagamento"),
    staleTime: 300000,
    gcTime: 600000,
    retry: 1,
  });
}
