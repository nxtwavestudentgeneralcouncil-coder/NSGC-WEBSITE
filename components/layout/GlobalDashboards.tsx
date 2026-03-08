'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Crown, Users, Flag, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useAuthenticationStatus, useUserData } from '@nhost/react';

export function GlobalDashboards() {
    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();

    if (isLoading || !isAuthenticated || !user) return null;

    // Default to mapping nhost roles if they exist, or fallback to an empty array
    const userRoles = user?.roles ? user.roles : [];
    
    // Nhost typical roles come back like "me_user", "public_user", and custom ones like "admin" etc. 
    // We can just check normally. You may need to refine the exact role string mapping depending on Hasura configuration.
    const hasRole = (role: string) => userRoles.some(r => r.toLowerCase() === role.toLowerCase());

    return (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] flex items-center gap-2 pointer-events-auto">
            {hasRole('president') && (
                <>
                    <Button 
                        variant="ghost" 
                        className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        asChild
                    >
                        <Link href="/dashboard/president">
                            <Crown className="w-3.5 h-3.5" />
                            <span>President</span>
                        </Link>
                    </Button>
                    <div className="flex sm:hidden flex-col gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-cyan-500 border border-cyan-500/20 bg-black/80 backdrop-blur-md" asChild>
                            <Link href="/dashboard/president"><Crown className="w-3.5 h-3.5" /></Link>
                        </Button>
                    </div>
                </>
            )}
            
            {hasRole('council_member') && (
                <>
                    <Button 
                        variant="ghost" 
                        className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        asChild
                    >
                        <Link href="/dashboard/council">
                            <Users className="w-3.5 h-3.5" />
                            <span>Council</span>
                        </Link>
                    </Button>
                    <div className="flex sm:hidden flex-col gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-blue-400 border border-blue-500/20 bg-black/80 backdrop-blur-md" asChild>
                            <Link href="/dashboard/council"><Users className="w-3.5 h-3.5" /></Link>
                        </Button>
                    </div>
                </>
            )}
            
            {hasRole('club_head') && (
                <>
                    <Button 
                        variant="ghost" 
                        className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 border border-teal-500/20 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                        asChild
                    >
                        <Link href="/dashboard/clubs">
                            <Flag className="w-3.5 h-3.5" />
                            <span>Club Mgr</span>
                        </Link>
                    </Button>
                    <div className="flex sm:hidden flex-col gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-teal-400 border border-teal-500/20 bg-black/80 backdrop-blur-md" asChild>
                            <Link href="/dashboard/clubs"><Flag className="w-3.5 h-3.5" /></Link>
                        </Button>
                    </div>
                </>
            )}
            
            <>
                <Button 
                    variant="ghost" 
                    className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 border border-white/10 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    asChild
                >
                    <Link href="/dashboard/student">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Student</span>
                    </Link>
                </Button>
                <div className="flex sm:hidden flex-col gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-gray-300 border border-white/10 bg-black/80 backdrop-blur-md" asChild>
                        <Link href="/dashboard/student"><LayoutDashboard className="w-3.5 h-3.5" /></Link>
                    </Button>
                </div>
            </>
            {hasRole('admin') && (
                <>
                    <Button 
                        variant="ghost" 
                        className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-[#f0185c] hover:text-[#ff3b7a] hover:bg-[#f0185c]/10 border border-[#f0185c]/20 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(240,24,92,0.1)]"
                        asChild
                    >
                        <Link href="/dashboard/admin">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Admin</span>
                        </Link>
                    </Button>
                    <div className="flex sm:hidden flex-col gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-[#f0185c] border border-[#f0185c]/20 bg-black/80 backdrop-blur-md" asChild>
                            <Link href="/dashboard/admin"><Shield className="w-3.5 h-3.5" /></Link>
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
