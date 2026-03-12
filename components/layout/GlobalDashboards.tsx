'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Crown, Users, Flag, LayoutDashboard, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthenticationStatus, useUserData } from '@nhost/react';
import { useClubData } from '@/hooks/useClubData';
import { useSharedData } from '@/hooks/useSharedData';

export function GlobalDashboards() {
    const [mounted, setMounted] = useState(false);
    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();
    const { myClubByEmail, clubs } = useClubData();
    const { members } = useSharedData();

    useEffect(() => { setMounted(true); }, []);

    if (!mounted || isLoading || !isAuthenticated || !user) return null;

    // Default to mapping nhost roles if they exist, or fallback to an empty array
    const userRoles = user?.roles ? user.roles : [];
    
    // Nhost typical roles come back like "me_user", "public_user", and custom ones like "admin" etc. 
    const hasRole = (role: string) => userRoles.some(r => r.toLowerCase() === role.toLowerCase());

    const isCouncilMember = hasRole('admin') || hasRole('developer') || members.some(m => m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase());
    const isPresident = hasRole('president') || hasRole('admin') || hasRole('developer');
    const isAdminOrDev = hasRole('admin') || hasRole('developer');

    return (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] flex items-center gap-2 pointer-events-auto">
            {isPresident && (
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
            
            {isCouncilMember && (
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
            
            {isAdminOrDev ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 border border-teal-500/20 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Club Manager</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-50 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-black/90 border-white/10 backdrop-blur-xl text-white">
                        <DropdownMenuLabel className="font-mono text-xs text-teal-500 uppercase tracking-widest">Select Club</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {clubs?.map((club: any) => (
                            <DropdownMenuItem key={club.id} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                                <Link href={`/dashboard/club/${club.slug}`} className="w-full">
                                    {club.name}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                        {(!clubs || clubs.length === 0) && (
                            <DropdownMenuItem disabled className="text-gray-500 italic">No clubs found</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : myClubByEmail ? (
                <>
                    <Button 
                        variant="ghost" 
                        className="hidden sm:flex gap-2 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-widest text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 border border-teal-500/20 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                        asChild
                    >
                        <Link href={`/dashboard/club/${myClubByEmail.slug}`}>
                            <Flag className="w-3.5 h-3.5" />
                            <span>Club Dashboard</span>
                        </Link>
                    </Button>
                    <div className="flex sm:hidden flex-col gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-teal-400 border border-teal-500/20 bg-black/80 backdrop-blur-md" asChild>
                            <Link href={`/dashboard/club/${myClubByEmail.slug}`}><Flag className="w-3.5 h-3.5" /></Link>
                        </Button>
                    </div>
                </>
            ) : null}
            
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
