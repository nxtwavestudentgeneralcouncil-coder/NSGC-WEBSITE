'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Sun, Moon, Settings, LayoutDashboard, Shield, Bell, Monitor, LogOut, Crown, Megaphone, Calendar, Vote, MessageCircleWarning, Users, Trophy, ShoppingBag, MessageSquare, TerminalSquare, Flag, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = () => {
            const roleStr = localStorage.getItem('userRoles');
            const legacyRole = localStorage.getItem('userRole');
            const name = localStorage.getItem('userName');
            
            let roles: string[] = [];
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
                setUserName(name);
                setUserRole(roles[0]);
            } else {
                setIsLoggedIn(false);
                setUserName('');
                setUserRole('');
            }
        };

        checkAuth();
        window.addEventListener('auth-change', checkAuth);
        return () => window.removeEventListener('auth-change', checkAuth);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header (visible only on small screens) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel z-50 flex items-center justify-between px-4 border-b border-blue-500/30">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-blue-500/10 border border-blue-500 flex items-center justify-center text-blue-400 font-bold text-lg">
                        N
                    </div>
                    <span className="font-display tracking-[0.2em] text-white">NSGC</span>
                </Link>
                <button className="text-blue-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Main Command Sidebar */}
            <motion.nav
                className={cn(
                    "fixed left-0 top-0 bottom-0 z-50 glass-panel border-r border-blue-500/30 transition-all duration-500 ease-in-out flex flex-col justify-between",
                    "w-20 lg:w-64",
                    isMobileMenuOpen ? "translate-x-0 w-64 pt-16" : "-translate-x-full md:translate-x-0 pt-0"
                )}
            >


                <div className="p-4 lg:p-6 flex flex-col gap-8 flex-1 overflow-y-auto scrollbar-hide relative z-10 w-full md:pr-6 lg:pr-8">

                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-3 group relative mb-4 hidden md:flex">
                        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500 rounded-sm flex items-center justify-center text-blue-400 font-bold text-xl relative overflow-hidden group-hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <span className="font-display font-bold tracking-widest relative z-10">N</span>
                        </div>
                        <div className="flex md:hidden lg:flex flex-col">
                            <span className="text-lg font-display tracking-[0.3em] text-white leading-none group-hover:text-blue-400 transition-colors uppercase">NSGC</span>
                            <span className="text-[10px] font-mono text-blue-500/80 tracking-[0.2em] mt-1">COMMAND</span>
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
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "relative flex items-center gap-4 p-3 group overflow-hidden transition-all duration-300 rounded-sm",
                                        isActive ? "bg-blue-500/10 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />}
                                    <Icon className={cn("w-5 h-5", isActive ? "animate-pulse-slow" : "")} />
                                    <span className="block md:hidden lg:block text-xs font-mono uppercase tracking-[0.2em]">{item.name}</span>
                                    {isActive && <div className="block md:hidden lg:block absolute right-2 w-1.5 h-1.5 bg-blue-400 animate-pulse-slow shadow-[0_0_5px_rgba(96,165,250,0.8)]" />}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="p-4 lg:p-6 border-t border-blue-500/20 relative z-10 w-full md:pr-6 lg:pr-8 flex flex-col gap-4">
                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            {/* Dashboard link depending on role */}

                            {/* Utility Icons */}
                            <div className="flex items-center gap-2 mt-2">
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-sm w-full lg:w-10" asChild onClick={() => setIsMobileMenuOpen(false)}>
                                    <Link href="/settings">
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-sm w-full lg:w-10"
                                    onClick={() => {
                                        localStorage.removeItem('userRole');
                                        localStorage.removeItem('userRoles');
                                        localStorage.removeItem('userName');
                                        window.dispatchEvent(new Event('auth-change'));
                                        window.location.href = '/login';
                                    }}
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button className="w-full justify-start lg:justify-center rounded-sm text-xs font-mono uppercase tracking-[0.2em] bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/40" asChild onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/login">
                                <User className="w-4 h-4 mr-0 lg:mr-2" />
                                <span className="inline md:hidden lg:inline">LOGIN</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </motion.nav>
            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
