'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Lock, User, ArrowRight, Shield, Crown } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [role] = useState('student');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const storedUsersStr = localStorage.getItem('nsgc_users');
        if (storedUsersStr) {
            try {
                const storedUsers = JSON.parse(storedUsersStr);
                const matchedUser = storedUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
                if (matchedUser) {
                    // We don't check password for mock users yet in this prototype
                    localStorage.setItem('userRoles', JSON.stringify(matchedUser.roles));
                    localStorage.setItem('userName', matchedUser.name);
                    localStorage.removeItem('userRole'); // clear legacy
                    window.dispatchEvent(new Event('auth-change'));
                    
                    // Route to highest privilege dashboard or just student
                    if (matchedUser.roles.includes('admin')) router.push('/dashboard/admin');
                    else if (matchedUser.roles.includes('president')) router.push('/dashboard/president');
                    else if (matchedUser.roles.includes('council')) router.push('/dashboard/council');
                    else if (matchedUser.roles.includes('clubs')) router.push('/dashboard/clubs');
                    else router.push('/dashboard/student');
                    
                    return;
                }
            } catch (error) {
                console.error('Failed to parse stored users during login', error);
            }
        }

        // Server-Side Universal Login Check (Fallback)
        import('@/app/actions/auth').then(async ({ universalLogin }) => {
            const result = await universalLogin(email, password); 

            if (result.success && result.role) {
                // It's a special role (Admin/President/Council)
                localStorage.setItem('userRoles', JSON.stringify([result.role]));
                localStorage.setItem('userName', result.userName || 'User');
                localStorage.removeItem('userRole'); // clear legacy
                window.dispatchEvent(new Event('auth-change'));
                router.push(`/dashboard/${result.role}`);
            } else {
                // Fallback to Student Login (Mock)
                setTimeout(() => {
                    localStorage.setItem('userRoles', JSON.stringify(['student']));
                    localStorage.setItem('userName', 'Student Name');
                    localStorage.removeItem('userRole'); // clear legacy
                    window.dispatchEvent(new Event('auth-change'));
                    router.push('/dashboard/student');
                    setLoading(false);
                }, 1000);
            }
        });
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
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-400">
                        Don't have an account? <Link href="/signup" className="text-cyan-500 hover:underline">Sign up</Link>
                    </p>

                </CardFooter>
            </Card>
        </div>
    );
}
