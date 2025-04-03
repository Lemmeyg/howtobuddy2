import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Check if we're on a dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      // Redirect to login if there is no session
      const redirectUrl = new URL('/login', request.url);
      // Add the original URL as a query parameter to redirect back after login
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
} 