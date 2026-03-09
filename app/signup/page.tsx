'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useSignUpEmailPassword, useProviderLink } from '@nhost/react';

export default function SignupPage() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { signUpEmailPassword, isLoading } = useSignUpEmailPassword();
    const { google } = useProviderLink();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const result = await signUpEmailPassword(email, password, {
            defaultRole: 'student',
            allowedRoles: ['student'],
            displayName: `${firstName} ${lastName}`
        });

        if (result.isError) {
            setErrorMsg(result.error?.message || "Failed to create account.");
            return;
        }

        if (result.isSuccess) {
            router.push('/dashboard/student');
        }
    };
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />

            <Card className="w-full max-w-md bg-white/5 border-white/10 relative z-10">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
                        N
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>Join the NSGC community today</CardDescription>
                </CardHeader>
                <CardContent>
                    {errorMsg && (
                        <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
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
                                    className="w-full bg-black/50 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'} 
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
                            Sign up with Google
                        </a>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-400">
                        Already have an account? <Link href="/login" className="text-cyan-500 hover:underline">Sign in</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
