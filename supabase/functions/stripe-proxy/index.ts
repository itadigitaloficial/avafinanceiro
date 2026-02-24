import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, empresa_id, data } = await req.json();

    if (!empresa_id) {
      return new Response(JSON.stringify({ error: 'empresa_id é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch Stripe keys for company
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: keyData, error: keyError } = await supabase
      .from('stripe_keys')
      .select('stripe_secret_key')
      .eq('empresa_id', empresa_id)
      .single();

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'Chaves Stripe não encontradas para esta empresa' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripeKey = keyData.stripe_secret_key;
    const stripeBase = 'https://api.stripe.com/v1';
    const headers = {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    let result;

    switch (action) {
      case 'list_customers': {
        const params = new URLSearchParams({ limit: data?.limit || '20' });
        if (data?.starting_after) params.set('starting_after', data.starting_after);
        const res = await fetch(`${stripeBase}/customers?${params}`, { headers });
        result = await res.json();
        break;
      }

      case 'create_customer': {
        const body = new URLSearchParams();
        if (data.name) body.set('name', data.name);
        if (data.email) body.set('email', data.email);
        if (data.phone) body.set('phone', data.phone);
        const res = await fetch(`${stripeBase}/customers`, { method: 'POST', headers, body });
        result = await res.json();
        break;
      }

      case 'list_products': {
        const params = new URLSearchParams({ limit: data?.limit || '20', active: 'true' });
        const res = await fetch(`${stripeBase}/products?${params}`, { headers });
        result = await res.json();
        break;
      }

      case 'create_product': {
        const body = new URLSearchParams();
        body.set('name', data.name);
        if (data.description) body.set('description', data.description);
        if (data.price) {
          body.set('default_price_data[unit_amount]', String(Math.round(data.price * 100)));
          body.set('default_price_data[currency]', 'brl');
        }
        const res = await fetch(`${stripeBase}/products`, { method: 'POST', headers, body });
        result = await res.json();
        break;
      }

      case 'create_payment_link': {
        const body = new URLSearchParams();
        body.set('line_items[0][price]', data.price_id);
        body.set('line_items[0][quantity]', String(data.quantity || 1));
        const res = await fetch(`${stripeBase}/payment_links`, { method: 'POST', headers, body });
        result = await res.json();
        break;
      }

      case 'create_invoice': {
        // Create invoice
        const invoiceBody = new URLSearchParams();
        invoiceBody.set('customer', data.customer_id);
        if (data.auto_advance !== undefined) invoiceBody.set('auto_advance', String(data.auto_advance));
        const invoiceRes = await fetch(`${stripeBase}/invoices`, { method: 'POST', headers, body: invoiceBody });
        const invoice = await invoiceRes.json();

        if (invoice.error) { result = invoice; break; }

        // Add invoice item
        const itemBody = new URLSearchParams();
        itemBody.set('invoice', invoice.id);
        itemBody.set('customer', data.customer_id);
        itemBody.set('amount', String(Math.round(data.amount * 100)));
        itemBody.set('currency', 'brl');
        itemBody.set('description', data.description || 'Cobrança');
        await fetch(`${stripeBase}/invoiceitems`, { method: 'POST', headers, body: itemBody });

        // Finalize invoice
        const finalizeRes = await fetch(`${stripeBase}/invoices/${invoice.id}/finalize`, { method: 'POST', headers });
        result = await finalizeRes.json();
        break;
      }

      case 'list_invoices': {
        const params = new URLSearchParams({ limit: data?.limit || '20' });
        if (data?.customer_id) params.set('customer', data.customer_id);
        const res = await fetch(`${stripeBase}/invoices?${params}`, { headers });
        result = await res.json();
        break;
      }

      case 'list_payment_links': {
        const params = new URLSearchParams({ limit: data?.limit || '20' });
        const res = await fetch(`${stripeBase}/payment_links?${params}`, { headers });
        result = await res.json();
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
