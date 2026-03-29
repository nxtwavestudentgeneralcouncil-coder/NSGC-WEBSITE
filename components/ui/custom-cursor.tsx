'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export function CustomCursor() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Position of the actual mouse
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    setIsMounted(true);
    
    // Check for touch device once on mount
    const touchQuery = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(touchQuery.matches);

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      // Only trigger state change if transitioning to visible
      setIsVisible(prev => prev ? prev : true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const isPointer = !!(
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      );
      
      setIsHovering(prev => prev === isPointer ? prev : isPointer);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY]);

  // Don't render anything until mounted or on touch devices
  if (!isMounted || isTouchDevice) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[999999] text-cyan-400"
      style={{
        x: mouseX,
        y: mouseY,
        originX: 0,
        originY: 0,
        opacity: isVisible ? 1 : 0
      }}
      initial={{ opacity: 0 }}
      animate={{
        scale: isHovering ? 1.15 : 1,
        opacity: isVisible ? 1 : 0,
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
