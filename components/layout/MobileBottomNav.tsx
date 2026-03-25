'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Crown, Calendar, Menu, MessageCircleWarning, X, Settings, LogOut, Megaphone, Flag, Users, Trophy, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthenticationStatus, useSignOut } from '@nhost/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthenticationStatus();
  const { signOut } = useSignOut();

  const primaryTabs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Council', href: '/council', icon: Crown },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Clubs', href: '/clubs', icon: Flag },
  ];

  const secondaryLinks = [
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
    { name: 'Gallery', href: '/gallery', icon: ImageIcon },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
    { name: 'Complaints', href: '/complaints', icon: MessageCircleWarning },
  ];

  return (
    <div className="contents">
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-xl border-t border-cyan-900/30 supports-[backdrop-filter]:bg-zinc-950/60 transition-colors pb-safe">
        <div className="flex items-center justify-around h-16 px-2 w-full">
          {primaryTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                onClick={() => setIsMoreMenuOpen(false)}
                className="relative flex flex-col items-center justify-center w-full h-full gap-1 group"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 w-8 h-1 bg-cyan-400 rounded-b-md shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <Icon 
                  className={cn(
                    "w-5 h-5 mb-1 transition-all duration-300", 
                    isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-300"
                  )} 
                />
                <span 
                  className={cn(
                    "text-[10px] uppercase font-mono tracking-widest leading-none",
                    isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-300"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
          
          <button 
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 group relative"
          >
             {isMoreMenuOpen && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute top-0 w-8 h-1 bg-cyan-400 rounded-b-md shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {isMoreMenuOpen ? (
               <X className="w-5 h-5 mb-1 text-cyan-400 transition-all duration-300" />
            ) : (
               <Menu className="w-5 h-5 mb-1 text-gray-400 group-hover:text-gray-300 transition-all duration-300" />
            )}
            <span className={cn(
                "text-[10px] uppercase font-mono tracking-widest leading-none",
                isMoreMenuOpen ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-300"
              )}
            >
              More
            </span>
          </button>
        </div>
      </div>
      
      {/* Full screen overlay menu for "More" */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[50] bg-black/95 backdrop-blur-2xl flex flex-col justify-end pb-20 overflow-y-auto animate-in fade-in duration-200">
           <div className="flex-1 overflow-y-auto p-6 pt-24 text-center items-center justify-center flex flex-col">
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                 {secondaryLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                       <Link
                         key={link.name}
                         href={link.href}
                         onClick={() => setIsMoreMenuOpen(false)}
                         className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-cyan-500/30 active:scale-95 transition-all"
                       >
                         <Icon className="w-6 h-6 mb-2 text-gray-400" />
                         <span className="text-xs font-mono uppercase text-gray-300 tracking-wider">
                           {link.name}
                         </span>
                       </Link>
                    );
                 })}
              </div>

              {isAuthenticated ? (
                <div className="w-full max-w-sm flex items-center gap-4 justify-center mt-auto border-t border-white/10 pt-6">
                   <Link href="/settings" onClick={() => setIsMoreMenuOpen(false)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                     <Settings className="w-5 h-5" />
                     <span className="text-sm font-mono uppercase tracking-widest">Settings</span>
                   </Link>
                  <div className="w-px h-6 bg-white/10" />
                   <button onClick={() => { 
                     Cookies.remove('nhost-refreshToken'); 
                     Cookies.remove('nhost-roles');
                     signOut(); 
                     setIsMoreMenuOpen(false); 
                   }} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors">
                     <LogOut className="w-5 h-5" />
                     <span className="text-sm font-mono uppercase tracking-widest">Logout</span>
                   </button>
                </div>
              ) : (
                <div className="w-full max-w-sm mt-auto border-t border-white/10 pt-6">
                   <Button asChild className="w-full" onClick={() => setIsMoreMenuOpen(false)}>
                      <Link href="/login">Login to Access Command</Link>
                   </Button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
