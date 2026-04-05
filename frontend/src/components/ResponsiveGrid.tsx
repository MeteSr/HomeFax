import React from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";

export interface ColConfig {
  mobile:  number;
  tablet:  number;
  desktop: number;
}

interface ResponsiveGridProps {
  cols:      ColConfig;
  gap?:      string;
  style?:    React.CSSProperties;
  className?: string;
  children:  React.ReactNode;
}

export function ResponsiveGrid({
  cols,
  gap = "1rem",
  style,
  className,
  children,
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useBreakpoint();

  const count = isMobile ? cols.mobile : isTablet ? cols.tablet : cols.desktop;

  return (
    <div
      className={className}
      style={{
        display:             "grid",
        gridTemplateColumns: `repeat(${count}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
