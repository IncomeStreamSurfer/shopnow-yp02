import type { APIRoute } from "astro";
import { serverClient } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, source } = await request.json();
    if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
    const sb = serverClient();
    await sb.from("subscribers").upsert({ email, source: source || "site" });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Error" }), { status: 500 });
  }
};
