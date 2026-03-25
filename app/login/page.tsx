'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Lock, User, ArrowRight } from 'lucide-react';
import { useSignInEmailPassword, useProviderLink, useNhostClient } from '@nhost/react';
import Cookies from 'js-cookie';

import { useDashboardAuth } from '@/hooks/useDashboardAuth';

export default function LoginPage() {
    const router = useRouter();
    
    // Auto-redirect if already authenticated
    useDashboardAuth({
        redirectIfAuthenticated: '/dashboard/student'
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Nhost Auth Hook
    const nhost = useNhostClient();
    const [isLoading, setIsLoading] = useState(false);
    const { google } = useProviderLink();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Use nhost client directly instead of React hook to get immediate synchronous access to the session
            const result = await nhost.auth.signIn({ email, password });
            
            if (result.error) {
                console.error("Login failed via Nhost. Error Object:", JSON.stringify(result.error, null, 2));
                
                if (result.error.status === 0 || result.error.status === 429) {
                    setError("Too many login attempts. Please wait a minute and try again.");
                } else {
                    setError(result.error.message || "Invalid email or password.");
                }
                setIsLoading(false);
                return;
            }

            const session = result.session;
            const refreshToken = session?.refreshToken || localStorage.getItem('nhostRefreshToken');

            if (refreshToken) {
                const cookieOptions = { 
                    expires: 30, // 30 days
                    path: '/',
                    sameSite: 'Lax',
                    secure: process.env.NODE_ENV === 'production'
                } as const;

                Cookies.set('nhost-refreshToken', refreshToken, cookieOptions);

                // Sync roles to cookie for PASSIVE VERIFICATION in proxy.ts
                const userObj = session?.user;
                if (userObj) {
                    const rolesData = {
                        id: userObj.id,
                        roles: (userObj as any).roles || [],
                        defaultRole: userObj.defaultRole
                    };
                    Cookies.set('nhost-roles', JSON.stringify(rolesData), cookieOptions);
                }
            } else {
                console.error("[Login] No refresh token could be extracted.");
            }

            // Nhost user roles are available in session.user
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userObj = session?.user;
            const roles = (userObj as any)?.roles || [];
            const defaultRole = userObj?.defaultRole || '';
            
            if (roles.includes('admin') || defaultRole === 'admin') router.push('/dashboard/admin');
            else if (roles.includes('president') || defaultRole === 'president') router.push('/dashboard/president');
            else if (roles.includes('council_member') || defaultRole === 'council_member') router.push('/dashboard/council');
            else if (roles.includes('club_head') || defaultRole === 'club_head') router.push('/dashboard/club');
            else router.push('/dashboard/student');
        } catch (err: any) {
            console.error("Exception during login:", err);
            setError(err.message || "An unexpected error occurred during sign in.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black pointer-events-none" />

            <Card className="w-full max-w-md bg-white/5 border-white/10 relative z-10">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <img src="/images/nsgc_logo_transparent.png" alt="NSGC Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Sign in to access the NSGC Portal</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="student@university.edu"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role selection removed - defaulting to student */}
                        {/* <input type="hidden" value={role} /> */}

                        <Button
                            type="submit"
                            className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                            {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-transparent backdrop-blur-md text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <a href={google} className="w-full group bg-white hover:bg-gray-100 flex items-center justify-center gap-3 py-3 rounded-md transition-colors font-bold text-black border-transparent">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Sign in with Google
                        </a>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-400">
                        Don&apos;t have an account? <Link href="/signup" className="text-cyan-500 hover:underline">Sign up</Link>
                    </p>

                </CardFooter>
            </Card>
        </div>
    );
}
