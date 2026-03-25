import { NextRequest, NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

/**
 * Lightweight helper to get Nhost session without React dependencies.
 */
export async function getManualNhostSession(req: NextRequest) {
  const subdomain = (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim();
  const region = (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim();
  
  if (!subdomain || !region) return null;

  const nhost = new NhostClient({ subdomain, region });
  
  // Get refresh token from cookies
  const refreshToken = req.cookies.get('nhost-refreshToken')?.value;
  
  if (!refreshToken) return null;

  const { session, error } = await nhost.auth.refreshSession(refreshToken);
  
  if (error || !session) return null;
  
  return session;
}

/**
 * Verifies the Nhost session in an API route.
 * @param req The NextRequest object
 * @param allowedRoles Optional list of allowed roles. If provided, checks if user has at least one.
 * @returns The session if authorized, otherwise null.
 */
export async function verifySession(req: NextRequest, allowedRoles?: string[]) {
  const session = await getManualNhostSession(req);
  
  if (!session) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.user?.defaultRole;
    const roles = (session.user as any)?.roles || [];
    const allRoles = [userRole, ...roles];
    
    const isAuthorized = allRoles.some(role => allowedRoles.includes(role));
    if (!isAuthorized) {
      return null;
    }
  }

  return session;
}

/**
 * Standard unauthorized response for API routes.
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Standard forbidden response for API routes (authenticated but lacking roles).
 */
export function forbiddenResponse(message = 'Forbidden: Insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 });
}
