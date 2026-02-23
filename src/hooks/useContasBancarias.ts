import { useQuery } from "@tanstack/react-query";

export interface ContaBancaria {
  _id: string;
  nome?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo?: string;
  empresa?: string;
  [key: string]: any;
}

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-conta-bancaria";

async function fetchContasBancarias(): Promise<ContaBancaria[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar contas bancárias");
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export function useContasBancarias() {
  return useQuery({
    queryKey: ["contas-bancarias"],
    queryFn: fetchContasBancarias,
    staleTime: 60000,
    retry: 1,
  });
}
