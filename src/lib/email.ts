const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || "";
const FROM = "ShopNow <onboarding@resend.dev>";

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
}

export async function sendEmail({ to, subject, html, reply_to }: SendEmailArgs) {
  if (!RESEND_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping");
    return { skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, ...(reply_to ? { reply_to } : {}) }),
    });
    const body = await res.json();
    if (!res.ok) { console.error("[email] resend error", body); return { ok: false, body }; }
    return { ok: true, body };
  } catch (err) {
    console.error("[email] fetch error", err);
    return { ok: false, error: String(err) };
  }
}

export function orderEmailHtml(args: {
  email: string;
  total: string;
  items: Array<{ name: string; qty: number; price: string }>;
  orderId: string;
}) {
  const rows = args.items.map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">${i.name}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center">× ${i.qty}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${i.price}</td></tr>`).join("");
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#fafaf7;padding:24px;color:#0b0b0f"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e3dc;border-radius:16px;padding:32px"><h1 style="font-family:Georgia,serif;font-size:28px;margin:0 0 8px">Thanks for your order 🛍</h1><p style="margin:0 0 20px;color:#6b6b76">Order ID <code>${args.orderId}</code></p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px 0;border-bottom:2px solid #0b0b0f;font-size:12px;letter-spacing:0.15em;text-transform:uppercase">Item</th><th style="text-align:center;padding:10px 0;border-bottom:2px solid #0b0b0f;font-size:12px;letter-spacing:0.15em;text-transform:uppercase">Qty</th><th style="text-align:right;padding:10px 0;border-bottom:2px solid #0b0b0f;font-size:12px;letter-spacing:0.15em;text-transform:uppercase">Line</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:20px;padding-top:16px;border-top:2px solid #0b0b0f;display:flex;justify-content:space-between;font-weight:700;font-size:18px"><span>Total</span><span>${args.total}</span></div><p style="margin-top:28px;color:#6b6b76;font-size:14px">We'll email you again as soon as your order ships. Physical orders leave our Bristol warehouse within 24 hours.</p><p style="margin-top:8px;color:#6b6b76;font-size:14px">Questions? Just reply to this email.</p><p style="margin-top:24px;font-size:12px;color:#6b6b76">ShopNow · Everything you need, delivered fast.</p></div></body></html>`;
}
