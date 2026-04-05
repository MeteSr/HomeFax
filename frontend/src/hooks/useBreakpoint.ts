import { useState, useEffect } from "react";
import { BREAKPOINTS } from "../utils/breakpoints";

export interface Breakpoint {
  isMobile:  boolean; // ≤ 640px
  isTablet:  boolean; // 641px – 1024px
  isDesktop: boolean; // > 1024px
}

// Two simple max-width queries are easier to mock and cover all cases:
//   mobileQ   → ≤ 640px
//   notDesktopQ → ≤ 1024px  (isTablet = notDesktop && !mobile)
function getBreakpoint(): Breakpoint {
  const mobileQ     = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE}px)`);
  const notDesktopQ = window.matchMedia(`(max-width: ${BREAKPOINTS.TABLET}px)`);
  const isMobile    = mobileQ.matches;
  const isTablet    = !isMobile && notDesktopQ.matches;
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    const mobileQ     = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE}px)`);
    const notDesktopQ = window.matchMedia(`(max-width: ${BREAKPOINTS.TABLET}px)`);

    const update = () => setBp(getBreakpoint());

    mobileQ.addEventListener("change", update);
    notDesktopQ.addEventListener("change", update);

    return () => {
      mobileQ.removeEventListener("change", update);
      notDesktopQ.removeEventListener("change", update);
    };
  }, []);

  return bp;
}
