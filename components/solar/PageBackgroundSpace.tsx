'use client';

import { Canvas } from '@react-three/fiber';
import { SpaceBackground } from './SpaceBackground';
import { motion } from 'framer-motion';
export function PageBackgroundSpace({ children }: { children: React.ReactNode }) {

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">
            {/* Background Scene - Enabled on all devices with dynamic performance scaling */}
            <div className="fixed inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 1.5]}>
                    <SpaceBackground />
                </Canvas>
            </div>
            
            {/* Static fallback for mobile (already handled by bg-black on parent) */}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
