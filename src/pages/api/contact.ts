import type { APIRoute } from "astro";
import { serverClient } from "../../lib/supabase";
import { sendEmail } from "../../lib/email";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "All fields required" }), { status: 400 });
    }
    const sb = serverClient();
    await sb.from("contact_messages").insert({ name, email, message });
    const to = import.meta.env.CONTACT_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "";
    if (to) {
      await sendEmail({
        to,
        subject: `[ShopNow] New contact form — ${name}`,
        reply_to: email,
        html: `<p><strong>${name}</strong> &lt;${email}&gt; wrote:</p><p>${String(message).replace(/</g, "&lt;")}</p>`,
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("[contact]", err);
    return new Response(JSON.stringify({ error: err?.message || "Error" }), { status: 500 });
  }
};
