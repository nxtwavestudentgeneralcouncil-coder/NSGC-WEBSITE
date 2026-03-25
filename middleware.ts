import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getNhostSession } from '@nhost/nextjs';
import { isRateLimited } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Rate Limiting Logic
  const ip = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  // Define limits
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isApiRoute = pathname.startsWith('/api/v1/nhost');
  
  // Stricter limits for authentication (5 requests per minute)
  if (isAuthRoute) {
    const limited = await isRateLimited(`rate_limit_auth_${ip}`, 5);
    if (limited) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many login/signup attempts. Please try again in a minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // API rate limiting
  if (isApiRoute) {
    // 5 requests per minute for sensitive API endpoints (as per requirements)
    const limited = await isRateLimited(`rate_limit_api_${ip}`, 5);
    if (limited) {
      return new NextResponse(
        JSON.stringify({ error: 'API rate limit exceeded. Maximum 5 requests per minute for sensitive endpoints.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Define sensitive routes for Auth/Role checks
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (!isDashboardRoute && !isApiRoute) {
    return NextResponse.next();
  }

  // 3. Get Nhost session from cookies
  const session = await getNhostSession({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '',
    region: process.env.NEXT_PUBLIC_NHOST_REGION || '',
  }, request as any);
  const isAuthenticated = !!session;

  // 4. Handle API routes (Return 401 if not authenticated)
  if (isApiRoute) {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // 5. Handle Dashboard routes
  if (isDashboardRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based redirection
    const userRole = session?.user?.defaultRole;
    const roles = (session?.user as any)?.roles || [];
    const allRoles = [userRole, ...roles];

    // President Dashboard Protection
    if (pathname.startsWith('/dashboard/president')) {
      const hasPresidentRole = allRoles.some(r => ['president', 'admin', 'developer'].includes(r));
      if (!hasPresidentRole) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }

    // Council Dashboard Protection
    if (pathname.startsWith('/dashboard/council')) {
      const hasCouncilRole = allRoles.some(r => ['council', 'president', 'admin', 'developer'].includes(r));
      if (!hasCouncilRole) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/v1/nhost/:path*',
    '/login',
    '/signup',
  ],
};
