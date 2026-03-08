'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Lock, User, ArrowRight } from 'lucide-react';
import { useSignInEmailPassword } from '@nhost/react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Nhost Auth Hook
    const { signInEmailPassword, isLoading } = useSignInEmailPassword();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Debug log to ensure the environment variables have been correctly reloaded
        console.log("Attempting Nhost login with subdomain:", process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN);

        // Use Nhost to authenticate
        const result = await signInEmailPassword(email, password);
        
        if (result.isError) {
            console.error("Login failed via Nhost. Error Object:", JSON.stringify(result.error, null, 2));
            
            // Map common Nhost errors or fallback to message
            if (result.error?.status === 0) {
                setError("Network Error: Could not reach Nhost. Nhost might be rate-limiting you (Too Many Requests). Please wait a few minutes.");
            } else {
                setError(result.error?.message || "Invalid email or password.");
            }
            return;
        }

        if (result.isSuccess && result.user) {
            // Nhost user roles are available in user object
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const roles = (result.user as any).roles || [];
            const defaultRole = result.user.defaultRole || '';
            
            if (roles.includes('admin') || defaultRole === 'admin') router.push('/dashboard/admin');
            else if (roles.includes('president') || defaultRole === 'president') router.push('/dashboard/president');
            else if (roles.includes('council_member') || defaultRole === 'council_member') router.push('/dashboard/council');
            else if (roles.includes('club_head') || defaultRole === 'club_head') router.push('/dashboard/clubs');
            else router.push('/dashboard/student');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black pointer-events-none" />

            <Card className="w-full max-w-md bg-white/5 border-white/10 relative z-10">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                        N
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
