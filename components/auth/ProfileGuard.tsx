'use client';

import { useUserData, useAuthenticationStatus } from '@nhost/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { nhost } from '@/lib/nhost';

/**
 * ProfileGuard component ensures that authenticated users have completed their profile
 * with mandatory fields like phone number and gender.
 * If missing, they are redirected to /complete-profile.
 */
export function ProfileGuard({ children }: { children: React.ReactNode }) {
    const user = useUserData();
    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const router = useRouter();
    const pathname = usePathname();
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Only run check if not loading and user is authenticated
        if (!isLoading && isAuthenticated && user) {
            // Nhost stores custom data in metadata
            const metadata = (user as any)?.metadata || {};
            const phone = metadata.phone;
            const gender = metadata.gender;

            const isProfileIncomplete = !phone || !gender;
            const isOnCompleteProfilePage = pathname === '/complete-profile';
            const isAuthPage = ['/login', '/signup', '/'].includes(pathname);

            // If profile is incomplete and user is not on the completion page or auth pages
            if (isProfileIncomplete) {
                // Double-check: fetch fresh user data from the server to avoid stale cache
                if (!hasChecked) {
                    setHasChecked(true);
                    // Try refreshing the session to get fresh metadata
                    nhost.auth.refreshSession().then(() => {
                        // After refresh, the useUserData hook will re-render with updated data
                        // If still incomplete after refresh, the next effect cycle will redirect
                    }).catch(() => {
                        // If refresh fails, proceed with current data
                    });
                    return; // Wait for the refresh before redirecting
                }

                if (!isOnCompleteProfilePage && !isAuthPage && !pathname.startsWith('/api')) {
                    console.log('[ProfileGuard] Profile incomplete, redirecting to /complete-profile');
                    router.push('/complete-profile');
                }
            } else if (isOnCompleteProfilePage) {
                // If profile is complete but user is on /complete-profile, redirect them away
                router.push('/dashboard/student');
            }
        }
    }, [user, isAuthenticated, isLoading, pathname, router, hasChecked]);

    return <>{children}</>;
}
