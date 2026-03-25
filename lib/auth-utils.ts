import { NextRequest, NextResponse } from 'next/server';
import { getNhostSession } from '@nhost/nextjs';

/**
 * Verifies the Nhost session in an API route.
 * @param req The NextRequest object
 * @param allowedRoles Optional list of allowed roles. If provided, checks if user has at least one.
 * @returns The session if authorized, otherwise null.
 */
export async function verifySession(req: NextRequest, allowedRoles?: string[]) {
  const session = await getNhostSession({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '',
    region: process.env.NEXT_PUBLIC_NHOST_REGION || '',
  }, req as any);
  
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
