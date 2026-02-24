import { useQuery } from "@tanstack/react-query";
import { Beneficiario } from "@/types/conta";
import { getCachedData, setCachedData } from "@/lib/queryCache";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-beneficiario";

async function fetchBeneficiarios(): Promise<Beneficiario[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar beneficiários");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("beneficiarios", result);
  return result;
}

export function useBeneficiarios() {
  return useQuery({
    queryKey: ["beneficiarios"],
    queryFn: fetchBeneficiarios,
    initialData: getCachedData<Beneficiario[]>("beneficiarios"),
    staleTime: 300000,
    gcTime: 600000,
    retry: 1,
  });
}
