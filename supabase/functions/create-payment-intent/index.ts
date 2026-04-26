// supabase/functions/create-payment-intent/index.ts
// تشغيل في Supabase → Edge Functions
// متغيرات البيئة المطلوبة: STRIPE_SECRET_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amount, currency, invoice_id, client_name, description } = await req.json()

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "مبلغ غير صالح" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "لم يتم تكوين مفتاح Stripe" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // إنشاء PaymentIntent عبر Stripe API
    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)), // تحويل للسنتات
        currency: currency || "aed",
        "payment_method_types[]": "card",
        description: description || `فاتورة ${invoice_id}`,
        "metadata[invoice_id]": invoice_id || "",
        "metadata[client_name]": client_name || "",
      }),
    })

    const intent = await stripeRes.json()

    if (intent.error) {
      return new Response(JSON.stringify({ error: intent.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ client_secret: intent.client_secret, id: intent.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
