'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData, useAuthenticationStatus } from '@nhost/react';
import { nhost } from '@/lib/nhost';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompleteProfilePage() {
    const router = useRouter();
    const user = useUserData();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthenticationStatus();
    
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user) {
            const metadata = (user as any)?.metadata || {};
            if (metadata.phone && metadata.gender) {
                // Profile already complete
                router.push('/dashboard/student');
            }
        }
    }, [user, isAuthenticated, isAuthLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/v1/nhost/update-user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metadata: {
                        phone,
                        gender,
                        profileCompleted: true,
                        completedAt: new Date().toISOString()
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update profile');
            }

            // Refresh the Nhost session to update the local JWT with new metadata
            await nhost.auth.refreshSession();

            setIsSuccess(true);
            setTimeout(() => {
                // Hard redirect to force full re-fetch of user data from Nhost
                window.location.href = '/dashboard/student';
            }, 2000);

        } catch (err: any) {
            console.error('[CompleteProfile] Update failed:', err);
            setErrorMsg(err.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements to match the signup/login theme */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-500 border border-cyan-500/30">
                            <UserIcon size={32} />
                        </div>
                        <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                        <CardDescription>
                            We need a few more details to get you started on NSGC.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-8 space-y-4"
                                >
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 border border-green-500/30">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-400">Success!</h3>
                                    <p className="text-gray-400 text-center">Redirecting you to the dashboard...</p>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    {errorMsg && (
                                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+91 12345 67890"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="bg-black/50 border-white/10 pl-10 focus:border-cyan-500 focus:ring-cyan-500/20"
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Include country code for verification purposes.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <select
                                            id="gender"
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 appearance-none"
                                            required
                                        >
                                            <option value="" disabled className="bg-slate-900">Select Gender</option>
                                            <option value="Male" className="bg-slate-900">Male</option>
                                            <option value="Female" className="bg-slate-900">Female</option>
                                            <option value="Other" className="bg-slate-900">Other</option>
                                            <option value="Prefer not to say" className="bg-slate-900">Prefer not to say</option>
                                        </select>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-11"
                                    >
                                        {isSubmitting ? 'Updating...' : 'Finish Setup'}
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </CardContent>

                    <CardFooter className="text-center text-xs text-gray-500 border-t border-white/5 pt-4">
                        By continuing, you agree to the NSGC terms of service and privacy policy.
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
