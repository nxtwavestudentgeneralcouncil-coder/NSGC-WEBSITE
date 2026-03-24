'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export function CustomCursor() {
  const [isMounted, setIsMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Position of the actual mouse
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the element or any of its parents is a clickable element
      // Removed getComputedStyle check as it forces expensive style recalculation
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY]);

  if (!isMounted) return null;

  // Don't render custom cursor on touch devices where pointer is coarse
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[999999] text-cyan-400"
      style={{
        x: mouseX,
        y: mouseY,
        originX: 0,
        originY: 0,
      }}
      animate={{
        scale: isHovering ? 1.15 : 1,
        filter: isHovering 
          ? 'drop-shadow(0px 0px 12px rgba(6,182,212,0.9))' 
          : 'drop-shadow(0px 0px 8px rgba(6,182,212,0.5))',
        color: isHovering ? '#22d3ee' : '#06b6d4', // Slightly brighter cyan on hover
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="currentColor"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ transform: 'translate(-2px, -2px)' }} 
      >
        <path d="M2 2l20 8-9 2-4 10z" />
      </svg>
    </motion.div>
  );
}
