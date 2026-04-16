import React from "react";
import { COLORS, FONTS } from "@/theme";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "default";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  success: { backgroundColor: COLORS.sageLight, color: COLORS.plum,    border: `1px solid ${COLORS.sageMid}` },
  warning: { backgroundColor: COLORS.butter,    color: COLORS.plum,    border: `1px solid ${COLORS.sageMid}` },
  error:   { backgroundColor: COLORS.blush,     color: COLORS.plum,    border: `1px solid ${COLORS.sageMid}` },
  info:    { backgroundColor: COLORS.sky,       color: COLORS.plum,    border: `1px solid ${COLORS.sageMid}` },
  default: { backgroundColor: COLORS.sageLight, color: COLORS.plumMid, border: `1px solid ${COLORS.sageMid}` },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: "0.1rem 0.5rem",   fontSize: "0.6rem"  },
  md: { padding: "0.2rem 0.625rem", fontSize: "0.65rem" },
  lg: { padding: "0.3rem 0.75rem",  fontSize: "0.75rem" },
};

export function Badge({
  variant = "default",
  size = "md",
  children,
}: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: FONTS.sans,
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: 100,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
      }}
    >
      {children}
    </span>
  );
}
