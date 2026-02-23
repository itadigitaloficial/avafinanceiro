import { useQuery } from "@tanstack/react-query";

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
  return Array.isArray(data) ? data : [data];
}

export function useFormasPagamento() {
  return useQuery({
    queryKey: ["formas-pagamento"],
    queryFn: fetchFormasPagamento,
    staleTime: 60000,
    retry: 1,
  });
}
