import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { serverClient } from "../../../lib/supabase";
import { sendEmail, orderEmailHtml } from "../../../lib/email";

export const prerender = false;

const WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("No signature", { status: 400 });
  const body = await request.text();
  let event: any;
  try {
    if (WEBHOOK_SECRET) {
      event = stripe().webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("[stripe-webhook] signature fail", err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    try {
      const full = await stripe().checkout.sessions.retrieve(session.id, { expand: ["line_items.data.price.product"] });
      const items = ((full as any).line_items?.data || []).map((li: any) => ({ name: li.description, qty: li.quantity, unit_amount: li.price?.unit_amount ?? 0, total: li.amount_total ?? 0 }));
      const email = (full as any).customer_details?.email || session.customer_email || "";
      const amount_total = (full as any).amount_total ?? 0;
      const currency = (full as any).currency ?? "gbp";
      const shipping = (full as any).shipping_details || null;

      const sb = serverClient();
      await sb.from("orders").insert({ stripe_session_id: session.id, email, amount_total, currency, status: "paid", shipping, items });

      if (email) {
        const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(p / 100);
        await sendEmail({ to: email, subject: `Your ShopNow order is confirmed 🛍`, html: orderEmailHtml({ email, orderId: session.id.slice(-10).toUpperCase(), total: fmt(amount_total), items: items.map((i: any) => ({ name: i.name, qty: i.qty, price: fmt(i.total) })) }) });
      }
    } catch (err) {
      console.error("[stripe-webhook] process error", err);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
