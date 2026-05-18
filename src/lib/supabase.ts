import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const loginId = import.meta.env.VITE_LOGIN_ID ?? "";
export const loginEmail = import.meta.env.VITE_LOGIN_EMAIL ?? "";

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
export const isLoginConfigured = loginId.length > 0 && loginEmail.length > 0;

const clientUrl = supabaseUrl || "https://example.supabase.co";
const clientKey = supabaseAnonKey || "missing-anon-key";

export const supabase = createClient(clientUrl, clientKey);
