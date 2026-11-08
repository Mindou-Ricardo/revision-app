import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Pages accessibles sans être connecté
const PUBLIC_PATHS = ['/login', '/auth/'];

/**
 * - Rafraîchit la session Supabase (cookies) à chaque requête
 * - Redirige vers /login si l'utilisateur n'est pas connecté
 * - Redirige vers / si un utilisateur connecté ouvre /login
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Sans Supabase (mode local de développement), pas d'authentification.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Vérifie (et rafraîchit si besoin) la session. Ne rien insérer entre
  // createServerClient et cet appel, sinon la session peut être perdue.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  if (!isLoggedIn && !isPublic) {
    return redirectKeepingCookies(request, response, '/login');
  }

  if (isLoggedIn && pathname === '/login') {
    return redirectKeepingCookies(request, response, '/');
  }

  return response;
}

function redirectKeepingCookies(request: NextRequest, from: NextResponse, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques, les images et les assets publics
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
