'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    tiltIntensity?: number;
    glareOpacity?: number;
}

export function TiltCard({
    children,
    className,
    tiltIntensity = 12, // Reduced from 20 for more stability
    glareOpacity = 0.2, // Reduced from 0.4
    ...props
}: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smoother, slightly slower springs to reduce update frequency
    const mouseX = useSpring(x, { stiffness: 200, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 200, damping: 30 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;

        const xPct = mouseXFromCenter / width;
        const yPct = mouseYFromCenter / height;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={cn("relative transition-all duration-200 ease-out will-change-transform", className)}
            {...props as any}
        >
            <div
                style={{
                    transform: "translateZ(50px)",
                    transformStyle: "preserve-3d"
                }}
                className="h-full"
            >
                {children}
            </div>

            {/* Glare Effect */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-xl z-50 mix-blend-overlay"
                style={{
                    opacity: useTransform(
                        useMotionValue(0), // Placeholder, we'd ideally combine x/y for dynamic glare
                        [0, 1],
                        [0, glareOpacity]
                    ),
                    background: useTransform(
                        mouseX,
                        [-0.5, 0.5],
                        [
                            "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)", // Simplified for now
                            "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)"
                        ]
                    )
                }}
            />
        </motion.div>
    );
}
