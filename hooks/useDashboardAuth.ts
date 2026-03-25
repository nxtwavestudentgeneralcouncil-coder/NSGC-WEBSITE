import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticationStatus, useUserData } from '@nhost/react';

export type DashboardRole = 
    | 'admin' 
    | 'developer' 
    | 'president' 
    | 'council' 
    | 'council_member' 
    | 'club_head' 
    | 'club_manager' 
    | 'mess_admin' 
    | 'mess-admin'
    | 'hostel_complaints' 
    | 'hostel-complaints'
    | 'student' 
    | 'user' 
    | 'me_user';

interface UseDashboardAuthProps {
    allowedRoles?: DashboardRole[];
    redirectIfAuthenticated?: string; // For login page
    redirectTo?: string; // Default redirect if unauthorized
}

export function useDashboardAuth({ 
    allowedRoles, 
    redirectIfAuthenticated,
    redirectTo = '/dashboard/student' 
}: UseDashboardAuthProps = {}) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            if (!redirectIfAuthenticated) {
                router.push('/login');
            }
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roles = (user as any).roles || [];
        const defaultRole = user.defaultRole || '';
        const allRoles = [defaultRole, ...roles];

        // 1. Handle auto-redirect for login page if authenticated
        if (redirectIfAuthenticated) {
            if (allRoles.includes('admin') || allRoles.includes('developer')) router.push('/dashboard/admin');
            else if (allRoles.includes('president')) router.push('/dashboard/president');
            else if (allRoles.includes('council_member') || allRoles.includes('council')) router.push('/dashboard/council');
            else if (allRoles.includes('club_head') || allRoles.includes('club_manager')) router.push('/dashboard/club');
            else if (allRoles.includes('mess_admin')) router.push('/dashboard/mess-admin');
            else if (allRoles.includes('hostel_complaints') || allRoles.includes('hostel-complaints')) router.push('/dashboard/hostel-complaints');
            else router.push(redirectIfAuthenticated);
            return;
        }

        // 2. Check authorization for dashboard pages
        if (allowedRoles && allowedRoles.length > 0) {
            const hasAccess = allRoles.some(role => allowedRoles.includes(role as DashboardRole));
            
            if (hasAccess) {
                setIsAuthorized(true);
            } else {
                console.warn(`[Auth] User not authorized for this dashboard. Roles: ${allRoles.join(', ')}. Allowed: ${allowedRoles.join(', ')}`);
                router.push(redirectTo);
            }
        } else {
            // If no specific roles required, just being authenticated is enough
            setIsAuthorized(true);
        }
    }, [isAuthenticated, isLoading, user, router, allowedRoles, redirectIfAuthenticated, redirectTo]);

    return { 
        isAuthenticated, 
        isLoading, 
        isAuthorized, 
        user, 
        roles: user ? [user.defaultRole, ...((user as any).roles || [])] : [] 
    };
}
