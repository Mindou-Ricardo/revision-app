import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Retour de Google après la connexion : Supabase renvoie un `code`
 * qu'on échange contre une session (stockée en cookies).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/`);
      }
      console.error('Échec de la connexion Google :', error.message);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
