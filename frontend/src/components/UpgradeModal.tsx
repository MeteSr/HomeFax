/**
 * UpgradeModal — in-app plan selection dialog
 *
 * Shows Pro and Premium plan cards with prices and features.
 * Calls paymentService.subscribe(tier) on selection, then closes.
 */

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { PLANS, paymentService, type PlanTier } from "@/services/payment";
import { COLORS, FONTS } from "@/theme";

export interface UpgradeModalProps {
  open:    boolean;
  onClose: () => void;
}

type PaymentStep = "quoting" | "approving" | "confirming";

const STEP_LABEL: Record<PaymentStep, string> = {
  quoting:    "Fetching ICP price…",
  approving:  "Approve in Internet Identity…",
  confirming: "Confirming…",
};

const SHOWN_TIERS: PlanTier[] = ["Pro", "Premium"];

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [step, setStep]               = useState<PaymentStep | null>(null);
  const [error, setError]             = useState<string | null>(null);

  if (!open) return null;

  const plans = PLANS.filter((p) => SHOWN_TIERS.includes(p.tier));

  async function handleSelect(tier: PlanTier) {
    setLoadingTier(tier);
    setStep(null);
    setError(null);
    try {
      await paymentService.subscribe(tier, (s) => setStep(s));
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Payment failed. Please try again.");
    } finally {
      setLoadingTier(null);
      setStep(null);
    }
  }

  const periodLabel: Record<string, string> = {
    month: "/mo",
    year:  "/yr",
    free:  "",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade Your Plan"
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         1000,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     "rgba(14,14,12,0.55)",
      }}
    >
      <div
        style={{
          background:  COLORS.white,
          border:      `1px solid ${COLORS.rule}`,
          padding:     "2rem",
          maxWidth:    "680px",
          width:       "calc(100% - 2rem)",
          position:    "relative",
        }}
      >
        {/* Dismiss */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position:   "absolute",
            top:        "1rem",
            right:      "1rem",
            background: "none",
            border:     "none",
            cursor:     "pointer",
            color:      COLORS.plumMid,
            padding:    "0.25rem",
          }}
        >
          <X size={18} />
        </button>

        {/* Heading */}
        <h2 style={{ fontFamily: FONTS.serif, fontWeight: 900, fontSize: "1.5rem", color: COLORS.plum, margin: "0 0 0.375rem" }}>
          Upgrade Your Plan
        </h2>
        <p style={{ fontFamily: FONTS.sans, fontSize: "0.875rem", color: COLORS.plumMid, margin: "0 0 1.75rem" }}>
          Choose a plan to unlock more features.
        </p>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {plans.map((plan) => (
            <div
              key={plan.tier}
              style={{
                border:   `1.5px solid ${plan.tier === "Premium" ? COLORS.sage : COLORS.rule}`,
                padding:  "1.25rem",
                display:  "flex",
                flexDirection: "column",
                gap:      "0.75rem",
                background: plan.tier === "Premium" ? COLORS.sageLight : COLORS.white,
              }}
            >
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.plumMid, marginBottom: "0.2rem" }}>
                  {plan.tier}
                </div>
                <div style={{ fontFamily: FONTS.serif, fontWeight: 700, fontSize: "1.75rem", color: COLORS.plum, lineHeight: 1 }}>
                  ${plan.price}
                  <span style={{ fontFamily: FONTS.sans, fontSize: "0.875rem", fontWeight: 400, color: COLORS.plumMid }}>
                    {periodLabel[plan.period]}
                  </span>
                </div>
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", fontFamily: FONTS.sans, fontSize: "0.8rem", color: COLORS.plum }}>
                    <Check size={12} color={COLORS.sage} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.tier)}
                disabled={loadingTier !== null}
                aria-label={`Select ${plan.tier}`}
                style={{
                  marginTop:   "auto",
                  background:  plan.tier === "Premium" ? COLORS.sage : COLORS.plum,
                  color:       COLORS.white,
                  border:      "none",
                  padding:     "0.6rem 1rem",
                  fontFamily:  FONTS.sans,
                  fontWeight:  600,
                  fontSize:    "0.875rem",
                  cursor:      loadingTier ? "wait" : "pointer",
                  width:       "100%",
                  opacity:     loadingTier && loadingTier !== plan.tier ? 0.5 : 1,
                }}
              >
                {loadingTier === plan.tier && step
                  ? STEP_LABEL[step]
                  : `Select ${plan.tier}`}
              </button>
            </div>
          ))}
        </div>

        {/* Payment error */}
        {error && (
          <p style={{
            marginTop:  "1rem",
            padding:    "0.625rem 0.875rem",
            background: "#FEF2F2",
            border:     `1px solid ${COLORS.rust}`,
            fontFamily: FONTS.sans,
            fontSize:   "0.8rem",
            color:      COLORS.rust,
            lineHeight: 1.5,
          }}>
            {error}
          </p>
        )}

        {/* Dismiss link */}
        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button
            onClick={onClose}
            aria-label="Maybe Later"
            style={{
              background: "none",
              border:     "none",
              fontFamily: FONTS.sans,
              fontSize:   "0.8rem",
              color:      COLORS.plumMid,
              cursor:     "pointer",
              textDecoration: "underline",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
