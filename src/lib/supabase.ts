import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE = import.meta.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE || "";

let _browser: SupabaseClient | null = null;
let _server: SupabaseClient | null = null;

export function browserClient(): SupabaseClient {
  if (_browser) return _browser;
  _browser = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  return _browser;
}

export function serverClient(): SupabaseClient {
  if (_server) return _server;
  _server = createClient(SUPABASE_URL, SUPABASE_SERVICE || SUPABASE_ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  return _server;
}
