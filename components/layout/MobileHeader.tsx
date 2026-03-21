'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import { User, LogIn } from 'lucide-react';
import { useAuthenticationStatus } from '@nhost/react';
import { Button } from '@/components/ui/button';

export function MobileHeader() {
  const { isAuthenticated } = useAuthenticationStatus();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="md:hidden sticky top-0 z-[40] bg-zinc-950/80 backdrop-blur-xl border-b border-cyan-900/30 supports-[backdrop-filter]:bg-zinc-950/60 transition-colors">
      <div className="flex h-16 items-center justify-between px-4 shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
        <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500 rounded-sm flex items-center justify-center relative overflow-hidden">
                <img src="/images/nsgc_logo_transparent.png" alt="NSGC Logo" className="w-6 h-6 object-contain relative z-10" />
            </div>
            <span className="text-lg font-display tracking-[0.2em] text-white">NSGC</span>
        </Link>
        
        <div className="flex items-center gap-2">
            {!isMounted ? (
                <div className="w-8 h-8" /> 
            ) : isAuthenticated ? (
                <>
                  <NotificationBell />
                  <Link href="/profile" className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                     <User className="w-4 h-4 text-cyan-400" />
                  </Link>
                </>
            ) : (
                <Button size="sm" variant="outline" className="h-8 shadow-none" asChild>
                    <Link href="/login">
                        <LogIn className="w-3.5 h-3.5 mr-2" />
                        <span className="text-xs uppercase tracking-widest font-mono">Login</span>
                    </Link>
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
