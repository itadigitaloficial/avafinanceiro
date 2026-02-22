import { useQuery } from "@tanstack/react-query";
import { Empresa } from "@/types/conta";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-empresa";

async function fetchEmpresas(): Promise<Empresa[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar dados da empresa");
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export function useEmpresa() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["empresa"],
    queryFn: fetchEmpresas,
    staleTime: 60000,
  });

  // Find the company related to the logged-in user
  const empresa = query.data?.find((e) => e.Usuario === user?.user_id) || query.data?.[0] || null;

  return { ...query, empresa };
}
