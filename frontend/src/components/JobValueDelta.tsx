/**
 * §17.3.3 — Dollar delta shown on job-log success screen.
 * Shows "+$X added to your home's documented value" estimate.
 */

import React from "react";
import { estimateJobValueDelta } from "@/services/scoreToValue";
import { COLORS, FONTS } from "@/theme";

interface JobValueDeltaProps {
  serviceType:  string;
  currentScore: number;
}

export function JobValueDelta({ serviceType, currentScore }: JobValueDeltaProps) {
  const delta = estimateJobValueDelta(serviceType, currentScore);
  if (!delta) return null;

  const fmt = (n: number) => "$" + n.toLocaleString("en-US");

  return (
    <div style={{
      padding:    "0.875rem 1.25rem",
      background: COLORS.sageLight,
      border:     `1px solid ${COLORS.sageMid}`,
      display:    "flex",
      alignItems: "center",
      gap:        "0.75rem",
    }}>
      <span style={{ fontFamily: FONTS.serif, fontWeight: 900, fontSize: "1.25rem", color: COLORS.sageText }}>
        +{fmt(delta)}
      </span>
      <span style={{ fontFamily: FONTS.sans, fontSize: "0.6rem", letterSpacing: "0.06em", color: COLORS.plumMid }}>
        estimated added to your home's documented value
      </span>
    </div>
  );
}
