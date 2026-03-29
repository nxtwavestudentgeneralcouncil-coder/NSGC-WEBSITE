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

// In-memory cache for lockdown status (dev mode preserves some global state, production uses instance reuse)
let cachedLockdown: { active: boolean; timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds

async function getLockdownStatus() {
  const now = Date.now();
  if (cachedLockdown && (now - cachedLockdown.timestamp < CACHE_TTL)) {
    return cachedLockdown.active;
  }

  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '';
  const region = process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '';
  const adminSecret = process.env.NHOST_ADMIN_SECRET || '';
  
  if (!subdomain || !region || !adminSecret) return false;

  const url = `https://${subdomain.trim()}.graphql.${region.trim()}.nhost.run/v1/graphql`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': adminSecret.replace(/^["']|["']$/g, '').trim()
      },
      body: JSON.stringify({
        query: `query GetLockdownStatus { system_settings_by_pk(key: "lockdown") { value } }`
      }),
      // Use shorter timeout if supported by runtime
      signal: AbortSignal.timeout(3000) as any
    });
    const result = await res.json();
    const isActive = result?.data?.system_settings_by_pk?.value?.active === true;
    
    // Update cache
    cachedLockdown = { active: isActive, timestamp: now };
    return isActive;
  } catch (e) {
    console.error('[Middleware] Lockdown check failed', e);
    // If we have a stale cache, use it as fallback. Otherwise default to unlocked.
    return cachedLockdown?.active ?? false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Whitelist routes that are NEVER blocked (even in lockdown)
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.');
  const isLockdownPage = pathname === '/lockdown';
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/api/auth');
  const isSystemApi = pathname.startsWith('/api/v1/system');
  
  if (isPublicAsset || isLockdownPage || isSystemApi) {
    return NextResponse.next();
  }

  // 2. Get Nhost session (Passive Verification)
  const session = await getManualNhostSession(request);
  const isAuthenticated = !!session && !!session.user;
  
  const userRole = session?.user?.defaultRole;
  const roles = (session?.user as any)?.roles || [];
  const allRoles = (userRole ? [userRole, ...roles] : roles).map((r: string) => r.toLowerCase());
  const isAdmin = allRoles.some((r: string) => ['admin', 'developer'].includes(r));

  // 3. Emergency Lockdown Check
  if (!isAdmin && pathname !== '/lockdown') {
    const isLockdownActive = await getLockdownStatus();
    if (isLockdownActive) {
      // If it's an API request, return JSON instead of redirecting to avoid client errors
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'System Lockdown', 
            message: 'The system is currently in emergency lockdown mode. Access is temporarily suspended.' 
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/lockdown', request.url));
    }
  }

  // 4. Standard Route Protection
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isApiRoute = pathname.startsWith('/api/v1/nhost');

  if (!isDashboardRoute && !isApiRoute) {
    return NextResponse.next();
  }

  // Allow diagnose route without auth
  if (pathname === '/api/v1/nhost/diagnose-users') {
    return NextResponse.next();
  }

  // 5. Handle API routes
  if (isApiRoute) {
    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // 6. Handle Dashboard routes
  if (isDashboardRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based redirection logic...
    if (pathname.startsWith('/dashboard/admin') && !isAdmin) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
    }

    // President Dashboard Protection
    if (pathname.startsWith('/dashboard/president')) {
      const hasPresidentRole = allRoles.some((r: any) => ['president', 'admin', 'developer'].includes(r));
      if (!hasPresidentRole) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }

    // Council Dashboard Protection
    if (pathname.startsWith('/dashboard/council')) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Boys Warden Protection
    if (pathname.startsWith('/dashboard/boys-warden')) {
      const hasBoysRole = allRoles.some((r: any) => ['boys-warden', 'boys_warden', 'admin', 'developer', 'president'].includes(r));
      if (!hasBoysRole) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }

    // Girls Warden Protection
    if (pathname.startsWith('/dashboard/girls-warden')) {
      const hasGirlsRole = allRoles.some((r: any) => ['girls-warden', 'girls_warden', 'admin', 'developer', 'president'].includes(r));
      if (!hasGirlsRole) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
