import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { serverClient } from "../../lib/supabase";

export const prerender = false;

function getOrigin(request: Request): string {
  const envUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400 });
    }

    const sb = serverClient();
    const productIds = Array.from(new Set(items.map((i: any) => i.productId)));
    const { data: products, error } = await sb
      .from("products")
      .select("id, name, description, price_pence, compare_at_pence, currency, image_url")
      .in("id", productIds);
    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "Products not found" }), { status: 404 });
    }

    const { data: variants, error: vErr } = await sb
      .from("product_variants")
      .select("sku, product_id, size, color")
      .in("sku", items.map((i: any) => i.variantSku));
    if (vErr) throw vErr;

    const priceMap = new Map(products.map((p) => [p.id, p]));
    const variantMap = new Map((variants || []).map((v) => [v.sku, v]));
    const VARIANT_PRICE_PENCE: Record<string, number> = {
      "HRM-EBK-PDF": 1499,
      "HRM-EBK-AUD": 2199,
      "HRM-EBK-KND": 999,
    };

    const line_items = items.map((i: any) => {
      const p = priceMap.get(i.productId);
      if (!p) throw new Error(`Unknown product ${i.productId}`);
      const v = variantMap.get(i.variantSku);
      const label = v ? [v.size, v.color].filter(Boolean).join(" · ") || i.variantSku : i.variantSku;
      const unit_amount = VARIANT_PRICE_PENCE[i.variantSku] ?? p.price_pence;
      return {
        quantity: Math.max(1, Math.min(99, Number(i.qty || 1))),
        price_data: {
          currency: (p.currency || "GBP").toLowerCase(),
          unit_amount,
          product_data: {
            name: `${p.name}${label ? ` — ${label}` : ""}`,
            description: (p.description || "").slice(0, 500),
            images: p.image_url ? [p.image_url] : [],
            metadata: { product_id: p.id, variant_sku: i.variantSku },
          },
        },
      };
    });

    const origin = getOrigin(request);

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["GB","US","CA","IE","FR","DE","NL","AU","NZ"] },
      shipping_options: [
        { shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: 0, currency: "gbp" }, display_name: "Free UK Shipping", delivery_estimate: { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 3 } } } },
        { shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: 995, currency: "gbp" }, display_name: "International (5-10 days)", delivery_estimate: { minimum: { unit: "business_day", value: 5 }, maximum: { unit: "business_day", value: 10 } } } },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        source: "shopnow-web",
        cart: JSON.stringify(items.map((i: any) => ({ pid: i.productId, sku: i.variantSku, q: i.qty }))),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[checkout] error", err);
    return new Response(JSON.stringify({ error: err?.message || "Checkout error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
