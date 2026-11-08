import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Connu dès la compilation (variables NEXT_PUBLIC_* inlinées) :
// permet d'afficher le bon mode dès le premier rendu, sans attendre le fetch.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
