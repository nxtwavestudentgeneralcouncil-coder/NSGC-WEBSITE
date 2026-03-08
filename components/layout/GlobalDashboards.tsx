'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Crown, Users, Flag, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GlobalDashboards() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);

    useEffect(() => {
        const checkAuth = () => {
            let roles: string[] = [];
            const roleStr = localStorage.getItem('userRoles');
            const legacyRole = localStorage.getItem('userRole'); // Keep support just in case
            const name = localStorage.getItem('userName');
            
            if (roleStr) {
                try {
                    roles = JSON.parse(roleStr);
                } catch(e) {
                    roles = [roleStr];
                }
            } else if (legacyRole) {
                roles = [legacyRole];
            }

            if (roles.length > 0 && name) {
                setIsLoggedIn(true);
                setUserRoles(roles);
            } else {
                setIsLoggedIn(false);
                setUserRoles([]);
            }
        };

        checkAuth();
        window.addEventListener('auth-change', checkAuth);
        return () => window.removeEventListener('auth-change', checkAuth);
    }, []);

    if (!isLoggedIn) return null;

    const hasRole = (role: string) => userRoles.includes(role);

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
            
            {hasRole('council') && (
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
            
            {(hasRole('clubs') || hasRole('club manager')) && (
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
