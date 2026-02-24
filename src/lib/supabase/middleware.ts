import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // Invalid/expired refresh token (e.g. "Refresh Token Not Found") – clear stale session
    const msg = (err as Error)?.message ?? '';
    if (msg.includes('Refresh Token') || msg.includes('AuthApiError')) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  }

  // Protect /admin/dashboard, /admin/leistungen and /admin/inventory – redirect to login if not authenticated
  const isAdminProtected =
    request.nextUrl.pathname.startsWith('/admin/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin/leistungen') ||
    request.nextUrl.pathname.startsWith('/admin/inventory');
  if (isAdminProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
