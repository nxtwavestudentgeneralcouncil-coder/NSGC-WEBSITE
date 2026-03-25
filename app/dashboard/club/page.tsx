'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticationStatus, useUserData } from '@nhost/react';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { useClubData } from '@/hooks/useClubData';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

export default function ClubDashboardRouter() {
    const router = useRouter();
    const { isLoading: authLoading, user, isAuthenticated } = useDashboardAuth({
        allowedRoles: ['club_head', 'club_manager', 'admin', 'developer', 'president']
    });
    
    const { myClubByEmail, myClubByEmailLoading, allClubs, isLoaded: clubDataLoaded } = useClubData();
    const [message, setMessage] = useState('Verifying club access...');

    // Roles and Overrides
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRoles = (user as any)?.roles || [];
    const defaultRole = user?.defaultRole || '';
    const hasOverrideRole = userRoles.includes('admin') || userRoles.includes('developer') || userRoles.includes('president') || defaultRole === 'admin' || defaultRole === 'developer' || defaultRole === 'president';

    useEffect(() => {
        if (!authLoading && clubDataLoaded) {
            if (!user) {
                // useDashboardAuth handles redirection to login
                return;
            }

            if (!myClubByEmailLoading) {
                if (myClubByEmail && myClubByEmail.slug) {
                    setMessage(`Redirecting to ${myClubByEmail.name}...`);
                    router.push(`/dashboard/club/${myClubByEmail.slug}`);
                } else if (hasOverrideRole) {
                    // Admins who don't have a specific club assigned stay on this page 
                    // and we'll show them the list of all clubs.
                    setMessage('Administrative Access: Select a club to manage.');
                } else {
                    setMessage('No club profile found associated with your account.');
                }
            }
        }
    }, [authLoading, user, myClubByEmail, myClubByEmailLoading, router, hasOverrideRole, clubDataLoaded]);

    const isLoading = authLoading || myClubByEmailLoading || (isAuthenticated && myClubByEmail && !hasOverrideRole);

    return (
        <div className="min-h-screen bg-[#0B0B14] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                        <p className="text-slate-400 font-medium animate-pulse">{message}</p>
                    </div>
                ) : hasOverrideRole && !myClubByEmail ? (
                    <div className="space-y-8 w-full mt-20">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">Club Administration</h1>
                            <p className="text-slate-400">Select a club to manage as an administrator.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allClubs.map(club => (
                                <div 
                                    key={club.id}
                                    onClick={() => router.push(`/dashboard/club/${club.slug}`)}
                                    className="bg-[#111625] border border-white/5 hover:border-cyan-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:translate-y-[-4px] group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                            {club.logo_url ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" /> : <div className="text-xl font-bold">{club.name[0]}</div>}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-white group-hover:text-cyan-400">{club.name}</h3>
                                            <p className="text-xs text-slate-500">{club.category}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#111625] border border-white/10 rounded-[24px] p-8 shadow-2xl max-w-md mx-auto">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
                        <p className="text-slate-400 mb-8">
                            It looks like you don't have a club assigned to your email address (<span className="text-white">{user?.email}</span>). 
                            Please contact the President's Office to register your club.
                        </p>
                        <Button 
                            onClick={() => router.push('/dashboard/student')}
                            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 gap-2 h-12 rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go to Student Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
