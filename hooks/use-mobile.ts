'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user is on a mobile device.
 * Considers both window width and pointer type (touch).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      // Common mobile breakpoint is 1024px for tablets, but let's use 768px for phones/small tablets
      // and also check for coarse pointer (touch)
      const isMobileSize = window.innerWidth < 1024;
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      
      setIsMobile(isMobileSize || isTouch);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
