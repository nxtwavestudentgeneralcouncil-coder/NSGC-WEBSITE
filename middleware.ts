import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight helper to get Nhost session without React or heavy JS-SDK dependencies.
 * Injected directly into middleware to avoid Turbopack resolution issues with transitive imports.
 */
async function getManualNhostSession(req: NextRequest) {
  const refreshToken = req.cookies.get('nhostRefreshToken')?.value;
  
  if (!refreshToken) return null;
  
  const rolesCookie = req.cookies.get('nhostRoles')?.value;
  let user = null;
  
  if (rolesCookie) {
    try {
      user = JSON.parse(decodeURIComponent(rolesCookie));
    } catch (e) {
       // Rollback to non-decoded for backward compatibility
       try {
         user = JSON.parse(rolesCookie);
       } catch (innerE) {
         console.error('[Middleware] Failed to parse roles cookie', e);
       }
    }
  }

  return { refreshToken, user };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define sensitive routes
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isApiRoute = pathname.startsWith('/api/v1/nhost');

  if (!isDashboardRoute && !isApiRoute) {
    return NextResponse.next();
  }

  // Allow diagnose route without auth (temporary)
  if (pathname === '/api/v1/nhost/diagnose-users') {
    return NextResponse.next();
  }

  // 2. Get Nhost session from cookies (Passive Verification)
  const session = await getManualNhostSession(request);
  const isAuthenticated = !!session && !!session.user;

  // 3. Handle API routes (Return 401 if not authenticated)
  if (isApiRoute) {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // 4. Handle Dashboard routes
  if (isDashboardRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based redirection
    const userRole = session?.user?.defaultRole;
    const roles = (session?.user as any)?.roles || [];
    const allRoles = (userRole ? [userRole, ...roles] : roles).map((r: string) => r.toLowerCase());

    // President Dashboard Protection
    if (pathname.startsWith('/dashboard/president')) {
      const hasPresidentRole = allRoles.some((r: any) => ['president', 'admin', 'developer'].includes(r));
      if (!hasPresidentRole) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }

    // Council Dashboard Protection
    // Note: We allow all authenticated users to reach this route because the page level guard 
    // will perform a specialized check against the database list for non-admin users.
    if (pathname.startsWith('/dashboard/council')) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/v1/nhost/:path*',
  ],
};
