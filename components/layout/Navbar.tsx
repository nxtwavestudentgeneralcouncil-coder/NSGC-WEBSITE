'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, LayoutDashboard, LogOut, Crown, Megaphone, Calendar, Vote, MessageCircleWarning, Users, Trophy, MessageSquare, TerminalSquare, Flag, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthenticationStatus, useSignOut } from '@nhost/react';
import NotificationBell from '@/components/NotificationBell';

const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Council', href: '/council' },
    { name: 'Members', href: '/members' },
    { name: 'Clubs', href: '/clubs' },
    { name: 'Announcements', href: '/announcements' },
    { name: 'Events', href: '/events' },
    { name: 'Elections', href: '/elections' },
    { name: 'Achievements', href: '/achievements' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Feedback', href: '/feedback' },
    { name: 'Complaints', href: '/complaints' },
];

const navIcons: Record<string, any> = {
    'Home': LayoutDashboard,
    'Council': Crown,
    'Members': Users,
    'Clubs': Flag,
    'Announcements': Megaphone,
    'Events': Calendar,
    'Elections': Vote,
    'Achievements': Trophy,
    'Gallery': ImageIcon,
    'Feedback': MessageSquare,
    'Complaints': MessageCircleWarning,
};

export function Navbar() {
    const { isAuthenticated } = useAuthenticationStatus();
    const { signOut } = useSignOut();
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "hidden md:flex fixed left-0 top-0 bottom-0 z-50 glass-panel border-r border-cyan-500/30 transition-all duration-500 flex-col justify-between w-20 lg:w-64"
            )}
        >
            <div className="p-4 lg:p-6 flex flex-col gap-8 flex-1 overflow-y-auto scrollbar-hide relative z-10 w-full md:pr-6 lg:pr-8">
                {/* LOGO */}
                <Link href="/" className="flex items-center gap-3 group relative mb-4 hidden md:flex">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500 rounded-sm flex items-center justify-center text-cyan-400 font-bold text-xl relative overflow-hidden group-hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <span className="font-display font-bold tracking-widest relative z-10">N</span>
                    </div>
                    <div className="flex md:hidden lg:flex flex-col">
                        <span className="text-lg font-display tracking-[0.3em] text-white leading-none group-hover:text-cyan-400 transition-colors uppercase">NSGC</span>
                        <span className="text-[10px] font-mono text-cyan-500/80 tracking-[0.2em] mt-1">COMMAND</span>
                    </div>
                </Link>

                {/* NAV ITEMS */}
                <div className="flex flex-col gap-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = navIcons[item.name] || TerminalSquare;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-4 p-3 group overflow-hidden transition-all duration-300 rounded-sm",
                                    isActive ? "bg-cyan-500/10 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
                                <Icon className={cn("w-5 h-5", isActive ? "animate-pulse-slow" : "")} />
                                <span className="block md:hidden lg:block text-xs font-mono uppercase tracking-[0.2em]">{item.name}</span>
                                {isActive && <div className="block md:hidden lg:block absolute right-2 w-1.5 h-1.5 bg-cyan-400 animate-pulse-slow shadow-[0_0_5px_rgba(6,182,212,0.8)]" />}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="p-4 lg:p-6 border-t border-cyan-500/20 relative z-10 w-full md:pr-6 lg:pr-8 flex flex-col gap-4">
                {isAuthenticated ? (
                    <div className="flex flex-col gap-3">
                        {/* Utility Icons */}
                        <div className="flex items-center gap-2 mt-2">
                            <NotificationBell />
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-sm w-full lg:w-10" asChild>
                                <Link href="/settings">
                                    <Settings className="w-4 h-4" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-sm w-full lg:w-10"
                                onClick={() => signOut()}
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button className="w-full justify-start lg:justify-center rounded-sm text-xs font-mono uppercase tracking-[0.2em] bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]" asChild>
                        <Link href="/login">
                            <User className="w-4 h-4 mr-0 lg:mr-2" />
                            <span className="inline md:hidden lg:inline">LOGIN</span>
                        </Link>
                    </Button>
                )}
            </div>
        </nav>
    );
}
