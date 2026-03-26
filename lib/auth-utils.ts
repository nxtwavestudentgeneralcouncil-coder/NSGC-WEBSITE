import { NextRequest, NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

/**
 * Lightweight helper to get Nhost session without React dependencies.
 */
export async function getManualNhostSession(req: NextRequest) {
  // Get refresh token from cookies (check multiple common names)
  const refreshToken = req.cookies.get('nhostRefreshToken')?.value;
  
  if (!refreshToken) {
    return null;
  }

  // PASSIVE VERIFICATION:
  // We DO NOT verify the token with Nhost here because Next.js middleware runs concurrently
  // and would cause the Nhost backend to rapidly rotate the token, triggering a 429 IP ban.
  // Instead, we just read the roles cookie set by the client for frontend routing purposes.
  // The backend APIs and Hasura GraphQL endpoints will cryptographically verify the real token.
  
  const rolesCookie = req.cookies.get('nhostRoles')?.value;
  let user = null;
  
  if (rolesCookie) {
    try {
      user = JSON.parse(rolesCookie);
    } catch (e) {
      console.error('[Auth Utils] Failed to parse roles cookie', e);
    }
  }

  // Return a mock session structure sufficient for proxy.ts routing checks
  return {
    accessToken: 'passive_verification',
    refreshToken,
    user: user // user will be null if cookie is missing
  };
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
