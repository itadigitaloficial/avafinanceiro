import { useQuery } from "@tanstack/react-query";
import { Empresa } from "@/types/conta";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedData, setCachedData } from "@/lib/queryCache";
import { syncEmpresa } from "@/lib/supabaseSync";

const API_URL = "https://n8n.itadigital.com.br/webhook/ava-empresa";

async function fetchEmpresas(): Promise<Empresa[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao carregar dados da empresa");
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  setCachedData("empresa", result);
  // Sync each empresa to Supabase in background
  result.forEach((e: any) => { if (e._id) syncEmpresa(e); });
  return result;
}

export function useEmpresa() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["empresa"],
    queryFn: fetchEmpresas,
    initialData: getCachedData<Empresa[]>("empresa"),
    staleTime: 300000,
    gcTime: 600000,
  });

  const empresa = query.data?.find((e) => e.Usuario === user?.user_id) || query.data?.[0] || null;

  return { ...query, empresa };
}
