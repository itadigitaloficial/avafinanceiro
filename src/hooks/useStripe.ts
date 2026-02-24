import { useState, useCallback } from "react";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FUNC_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/stripe-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callStripe(action: string, empresa_id: string, data?: any) {
  const res = await fetch(FUNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ action, empresa_id, data }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error?.message || json.error);
  return json;
}

export function useStripeKeys() {
  const { empresa } = useEmpresa();
  const empresaId = empresa?._id;

  const query = useQuery({
    queryKey: ["stripe_keys", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase
        .from("stripe_keys")
        .select("*")
        .eq("empresa_id", empresaId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  return { ...query, empresaId, hasKeys: !!query.data };
}

export function useSaveStripeKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, publishableKey, secretKey, createdBy }: {
      empresaId: string; publishableKey: string; secretKey: string; createdBy: string;
    }) => {
      const { data, error } = await supabase
        .from("stripe_keys")
        .upsert({
          empresa_id: empresaId,
          stripe_publishable_key: publishableKey,
          stripe_secret_key: secretKey,
          created_by: createdBy,
        }, { onConflict: "empresa_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe_keys"] });
      toast({ title: "Chaves salvas com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar chaves", description: err.message, variant: "destructive" });
    },
  });
}

export function useStripeCustomers(empresaId?: string) {
  return useQuery({
    queryKey: ["stripe_customers", empresaId],
    queryFn: () => callStripe("list_customers", empresaId!),
    enabled: !!empresaId,
  });
}

export function useStripeProducts(empresaId?: string) {
  return useQuery({
    queryKey: ["stripe_products", empresaId],
    queryFn: () => callStripe("list_products", empresaId!),
    enabled: !!empresaId,
  });
}

export function useStripeInvoices(empresaId?: string) {
  return useQuery({
    queryKey: ["stripe_invoices", empresaId],
    queryFn: () => callStripe("list_invoices", empresaId!),
    enabled: !!empresaId,
  });
}

export function useStripePaymentLinks(empresaId?: string) {
  return useQuery({
    queryKey: ["stripe_payment_links", empresaId],
    queryFn: () => callStripe("list_payment_links", empresaId!),
    enabled: !!empresaId,
  });
}

export function useStripeAction(empresaId?: string) {
  const queryClient = useQueryClient();

  const action = useCallback(async (actionName: string, data?: any) => {
    if (!empresaId) throw new Error("Empresa não encontrada");
    const result = await callStripe(actionName, empresaId, data);
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["stripe_customers"] });
    queryClient.invalidateQueries({ queryKey: ["stripe_products"] });
    queryClient.invalidateQueries({ queryKey: ["stripe_invoices"] });
    queryClient.invalidateQueries({ queryKey: ["stripe_payment_links"] });
    return result;
  }, [empresaId, queryClient]);

  return action;
}
